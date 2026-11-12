import React, { useState, useEffect, useMemo } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';
import { exportToDocx, exportToPdf, triggerFileDownload } from '../utils/fileExporters';
import { MemoryItem } from '../../server/memoryVaultService';
import { UserProfile } from '../../server/authService';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebaseConfig';
import { 
  Brain, 
  Plus, 
  Upload, 
  Search, 
  MessageSquare, 
  Pin, 
  PinOff, 
  Trash2, 
  RotateCcw, 
  Edit3, 
  Copy, 
  Download, 
  Folder, 
  FolderPlus, 
  Tag, 
  Sparkles, 
  FileText, 
  Lightbulb, 
  Briefcase, 
  Check, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Layers, 
  BookOpen, 
  Calendar, 
  FileSpreadsheet, 
  FileCode, 
  Settings, 
  ExternalLink,
  ChevronRight,
  Database,
  Camera,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';
import { CameraService } from '../services/CameraService';

export type VaultNavTab = 
  | 'all' 
  | 'photo'
  | 'document' 
  | 'note' 
  | 'idea' 
  | 'project' 
  | 'collections' 
  | 'pinned' 
  | 'trash' 
  | 'ask';

const STORAGE_VAULT_KEY = 'SUPERAI_AI_Memory_Vault_v1';
const DEFAULT_COLLECTIONS = [
  'Photos',
  'Documents',
  'Personal Notes',
  'Ideas',
  'School & Learning',
  'Projects',
  'Research',
  'Work',
];

interface AIMemoryVaultModalProps {
  onClose: () => void;
  currentUser?: UserProfile | null;
  authToken?: string;
  onLog?: (text: string, tag: string) => void;
  initialTab?: VaultNavTab;
}

export const AIMemoryVaultModal: React.FC<AIMemoryVaultModalProps> = ({
  onClose,
  currentUser,
  authToken,
  onLog,
  initialTab,
}) => {
  const userId = currentUser?.uid || 'guest_default';
  const userVaultKey = `${STORAGE_VAULT_KEY}_${userId}`;

  // Navigation & View state
  const [navTab, setNavTab] = useState<VaultNavTab>(initialTab || 'all');

  useEffect(() => {
    if (initialTab) setNavTab(initialTab);
  }, [initialTab]);

  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Search & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Memories State with User-Scoped LocalStorage & Supabase Sync
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(userVaultKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load memories from localStorage:', e);
    }
    // Seed initial memories for this user partition
    return [
      {
        id: 'mem_1',
        title: 'Neural Architecture Overview & Telemetry',
        content: '# Neural Architecture\nThe SUPERAI terminal connects 12 autonomous sub-engines with zero-trust local execution sandboxes. Core telemetry modules synchronize every 1000ms.\n\nKey Decisions:\n- All data processing must operate locally where possible.\n- AI integrations must provide fallback deterministic computing when external APIs experience rate limits.',
        type: 'project',
        tags: ['architecture', 'security', 'telemetry'],
        collection: 'Projects',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        isPinned: true,
        isTrashed: false,
        sourceReference: 'SUPERAI Core Specs',
      },
      {
        id: 'mem_2',
        title: 'Next-Gen Mobile Voice Assistant Concept',
        content: 'Idea: Implement wake-word detection using browser audio stream with real-time visual waveform.\n\nKey Benefits:\n- Completely hands-free control for field operators\n- Integrated with Language Studio for multi-lingual translation on-the-fly.',
        type: 'idea',
        tags: ['voice', 'ai', 'mobile'],
        collection: 'Ideas',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        isPinned: false,
        isTrashed: false,
      },
      {
        id: 'mem_3',
        title: 'Meeting Notes: Q4 Strategic Roadmaps',
        content: 'Executive briefing with SuperAI and team.\n\nMilestones:\n- Milestone 1: Launch Study Genius workspace (Completed).\n- Milestone 2: AI Data Analyst with Pearson correlation and IQR outlier cleaning (Completed).\n- Milestone 3: AI Workflow Automator with 10 built-in chained task actions (Completed).\n- Milestone 4: AI Memory Vault for grounded personal knowledge retrieval (In Progress).',
        type: 'note',
        tags: ['roadmap', 'milestones', 'q4'],
        collection: 'Work',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPinned: true,
        isTrashed: false,
      },
    ];
  });

  // Collections list
  const [customCollections, setCustomCollections] = useState<string[]>(DEFAULT_COLLECTIONS);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Active / Editing Memory Modal state
  const [isEditing, setIsEditing] = useState(false);
  const [activeMemory, setActiveMemory] = useState<Partial<MemoryItem> | null>(null);
  const [viewingMemory, setViewingMemory] = useState<MemoryItem | null>(null);

  // Document Upload State
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Ask Your Vault Chat State
  const [askQuestion, setAskQuestion] = useState('');
  const [askingVault, setAskingVault] = useState(false);
  const [vaultChatHistory, setVaultChatHistory] = useState<
    Array<{
      role: 'user' | 'assistant';
      content: string;
      citations?: Array<{ id: string; title: string; type: string }>;
    }>
  >([]);

  // Feedback & Photo Lightbox states
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activePhotoLightbox, setActivePhotoLightbox] = useState<MemoryItem | null>(null);
  const [renamingPhoto, setRenamingPhoto] = useState<{ id: string; name: string } | null>(null);

  // Real-time sync from Firestore & Cross-Component Window Events
  useEffect(() => {
    // 1. Listen for instant updates from Camera auto-save
    const handleVaultEvent = () => {
      try {
        const saved = localStorage.getItem(userVaultKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setMemories(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to reload local vault memories on event:', err);
      }
    };
    window.addEventListener('vault_updated', handleVaultEvent);

    // Also load any camera photos to ensure Photos category is fully populated across tabs
    CameraService.getPhotos(userId).then((photosList) => {
      if (Array.isArray(photosList) && photosList.length > 0) {
        setMemories((prev) => {
          let changed = false;
          const merged = [...prev];
          photosList.forEach((p) => {
            const rawId = p.id ? p.id.replace(/^(photo_)+/, '') : p.name;
            const memoryId = `photo_${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
            const exists = merged.some((m) => m.id === memoryId || m.id === p.id || (p.url && m.sourceReference === p.url));
            if (!exists) {
              changed = true;
              merged.unshift({
                id: memoryId,
                title: `Captured Photo: ${p.name}`,
                content: `Photo captured via SuperAI Camera.\nSource Reference: ${p.url}\nResolution: ${p.width || 'N/A'}x${p.height || 'N/A'}\nSize: ${(p.size ? (p.size / 1024).toFixed(1) : 'N/A')} KB`,
                type: 'photo',
                tags: ['camera', 'photo', 'captured', 'photos'],
                collection: 'photos',
                createdAt: p.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isPinned: false,
                isTrashed: false,
                sourceReference: p.url,
              });
            }
          });
          if (changed) {
            try {
              localStorage.setItem(userVaultKey, JSON.stringify(merged));
            } catch {}
            if (userId !== 'guest_default') {
              syncToFirestore(merged);
            }
            return merged;
          }
          return prev;
        });
      }
    }).catch((e) => console.warn('Photos auto-merge error:', e));

    if (userId === 'guest_default') {
      return () => {
        window.removeEventListener('vault_updated', handleVaultEvent);
      };
    }
    
    setIsSyncing(true);
    const docRef = doc(db, 'user_vault_records', userId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data();
        if (remoteData.memories && Array.isArray(remoteData.memories)) {
          setMemories(remoteData.memories);
          try {
            localStorage.setItem(userVaultKey, JSON.stringify(remoteData.memories));
          } catch (e) {
            console.warn('Failed to save memories to localStorage:', e);
          }
        }
      }
      setIsSyncing(false);
    }, (err) => {
      console.warn('[Firestore Vault Sync] Error:', err);
      setIsSyncing(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('vault_updated', handleVaultEvent);
    };
  }, [userId, userVaultKey]);

  // Helper to sync state to Firestore (called on user actions)
  const syncToFirestore = async (updatedMemories: MemoryItem[]) => {
    if (userId === 'guest_default') return;
    
    try {
      await setDoc(doc(db, 'user_vault_records', userId), {
        user_id: userId,
        memories: updatedMemories,
        updated_at: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('[Firestore Vault Update] Error:', err);
      handleFirestoreError(err, OperationType.WRITE, `user_vault_records/${userId}`);
    }
  };

  // Compute all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    memories.filter((m) => !m.isTrashed).forEach((m) => m.tags.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }, [memories]);

  // Storage telemetry calculation
  const storageMetrics = useMemo(() => {
    const active = memories.filter((m) => !m.isTrashed);
    const totalWords = active.reduce((acc, m) => acc + m.content.split(/\s+/).filter(Boolean).length, 0);
    const estBytes = active.reduce((acc, m) => acc + (m.title.length + m.content.length + 100), 0);
    return {
      count: active.length,
      words: totalWords,
      kb: (estBytes / 1024).toFixed(1),
      pinnedCount: active.filter((m) => m.isPinned).length,
      trashCount: memories.filter((m) => m.isTrashed).length,
    };
  }, [memories]);

  // Filter style helper for images
  const getFilterStyle = (m: any) => {
    if (!m.filters) return {};
    const f = m.filters;
    return {
      filter: `
        brightness(${f.brightness ?? 100}%) 
        contrast(${f.contrast ?? 100}%) 
        grayscale(${f.grayscale ? 100 : 0}%) 
        sepia(${f.sepia ? 100 : 0}%) 
        hue-rotate(${f.hueRotate ?? 0}deg)
      `
    };
  };

  // Filtered and Sorted Memories
  const displayedMemories = useMemo(() => {
    const uniqueMap = new Map<string, MemoryItem>();
    memories.forEach((m) => {
      const key = m.id || m.sourceReference;
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, m);
      }
    });
    const uniqueList = Array.from(uniqueMap.values());

    return uniqueList
      .filter((m) => {
        // Trash filter
        if (navTab === 'trash') {
          return m.isTrashed;
        }
        if (m.isTrashed) return false;

        // Tab category filter
        if (navTab === 'pinned' && !m.isPinned) return false;
        if (navTab === 'note' && m.type !== 'note') return false;
        if (navTab === 'document' && m.type !== 'document') return false;
        if (navTab === 'idea' && m.type !== 'idea') return false;
        if (navTab === 'project' && m.type !== 'project') return false;
        if (navTab === 'photo' && m.type !== 'photo' && m.collection?.toLowerCase() !== 'photos') return false;
        if (navTab === 'collections' && selectedCollection && m.collection !== selectedCollection) return false;

        // Custom collection filter
        if (selectedCollection && m.collection !== selectedCollection) return false;

        // Tag filter
        if (selectedTag && !m.tags.includes(selectedTag)) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = m.title.toLowerCase().includes(q);
          const matchContent = m.content.toLowerCase().includes(q);
          const matchTag = m.tags.some((t) => t.toLowerCase().includes(q));
          const matchCollection = m.collection.toLowerCase().includes(q);
          return matchTitle || matchContent || matchTag || matchCollection;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (sortBy === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        return a.title.localeCompare(b.title);
      });
  }, [memories, navTab, selectedCollection, selectedTag, searchQuery, sortBy]);

  // =========================================================================
  // MEMORY ACTIONS (CREATE, EDIT, PIN, TRASH, DELETE)
  // =========================================================================

  const handleStartCreateMemory = (presetType: MemoryItem['type'] = 'note') => {
    soundEngine.playClick();
    setActiveMemory({
      id: 'mem_' + Date.now(),
      title: '',
      content: '',
      type: presetType,
      tags: [],
      collection: selectedCollection || 'Personal Notes',
      isPinned: false,
      isTrashed: false,
    });
    setIsEditing(true);
  };

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMemory || !activeMemory.title?.trim()) {
      alert('Please enter a memory title.');
      return;
    }

    soundEngine.playSuccess();
    const now = new Date().toISOString();
    const finalMemory: MemoryItem = {
      id: activeMemory.id || 'mem_' + Date.now(),
      title: activeMemory.title.trim(),
      content: activeMemory.content?.trim() || '',
      type: activeMemory.type || 'note',
      tags: activeMemory.tags || [],
      collection: activeMemory.collection || 'Personal Notes',
      createdAt: activeMemory.createdAt || now,
      updatedAt: now,
      isPinned: !!activeMemory.isPinned,
      isTrashed: false,
      sourceReference: activeMemory.sourceReference?.trim() || undefined,
    };

    setMemories((prev) => {
      const exists = prev.some((m) => m.id === finalMemory.id);
      let updated;
      if (exists) {
        updated = prev.map((m) => (m.id === finalMemory.id ? finalMemory : m));
      } else {
        updated = [finalMemory, ...prev];
      }
      syncToFirestore(updated);
      return updated;
    });

    if (onLog) {
      onLog(`[MEMORY_VAULT] Saved memory "${finalMemory.title}" (${finalMemory.type.toUpperCase()})`, 'DATABASE');
    }

    setIsEditing(false);
    setActiveMemory(null);
  };

  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playClick();
    setMemories((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, isPinned: !m.isPinned, updatedAt: new Date().toISOString() } : m));
      syncToFirestore(updated);
      return updated;
    });
  };

  const handleMoveToTrash = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playClick();
    setMemories((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, isTrashed: true, updatedAt: new Date().toISOString() } : m));
      syncToFirestore(updated);
      return updated;
    });
    if (viewingMemory?.id === id) setViewingMemory(null);
  };

  const handleRestoreFromTrash = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playSuccess();
    setMemories((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, isTrashed: false, updatedAt: new Date().toISOString() } : m));
      syncToFirestore(updated);
      return updated;
    });
  };

  // Dedicated easy photo delete from gallery with immediate response and disk/cloud cleanup
  const handleDeletePhoto = async (memory: MemoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playAlertBeep();
    
    // 1. Immediately remove from local state
    setMemories((prev) => {
      const updated = prev.filter((m) => m.id !== memory.id);
      syncToFirestore(updated);
      try {
        localStorage.setItem(userVaultKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (activePhotoLightbox?.id === memory.id) {
      setActivePhotoLightbox(null);
    }

    // 2. Permanently remove via CameraService (disk, Firestore, Storage)
    try {
      await CameraService.deletePhoto({
        id: memory.id.replace(/^photo_/, ''),
        name: memory.title.replace(/^Captured Photo:\s*/, ''),
        url: memory.sourceReference || '',
        userId,
        createdAt: memory.createdAt,
      }, userId);
    } catch (err) {
      console.warn('Error deleting photo via CameraService:', err);
    }

    const photoName = memory.title.replace(/^Captured Photo:\s*/, '');
    setUploadSuccess(`Photo "${photoName}" deleted from Vault.`);
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  const handlePermanentDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playAlertBeep();
    setMemories((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      syncToFirestore(updated);
      try {
        localStorage.setItem(userVaultKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (viewingMemory?.id === id) setViewingMemory(null);
  };

  const handleDuplicateMemory = (memory: MemoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playSuccess();
    const clone: MemoryItem = {
      ...memory,
      id: 'mem_' + Date.now(),
      title: `${memory.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
    };
    setMemories((prev) => {
      const updated = [clone, ...prev];
      syncToFirestore(updated);
      return updated;
    });
  };

  // =========================================================================
  // DOCUMENT UPLOAD HANDLER (PDF, TXT, MD, CSV)
  // =========================================================================

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    soundEngine.playClick();
    setIsUploadingDoc(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const res = await fetch('/api/vault/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, fileName: file.name }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          const newDoc: MemoryItem = {
            id: 'mem_' + Date.now(),
            title: file.name.replace(/\.[^/.]+$/, ''),
            content: data.text,
            type: 'document',
            tags: ['uploaded', 'pdf'],
            collection: 'Documents',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPinned: false,
            isTrashed: false,
            sourceReference: `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
          };
          setMemories((prev) => {
            const updated = [newDoc, ...prev];
            syncToFirestore(updated);
            return updated;
          });
          soundEngine.playSuccess();
          setUploadSuccess(`Successfully extracted ${data.wordCount} words from "${file.name}"!`);
        } else {
          throw new Error(data.error || 'Failed to parse PDF.');
        }
      } else {
        // Plain text, Markdown, CSV
        const text = await file.text();
        if (!text.trim()) {
          throw new Error('Uploaded document is empty.');
        }

        const newDoc: MemoryItem = {
          id: 'mem_' + Date.now(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          content: text.trim(),
          type: 'document',
          tags: ['uploaded', ext],
          collection: 'Documents',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPinned: false,
          isTrashed: false,
          sourceReference: `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        };
        setMemories((prev) => {
          const updated = [newDoc, ...prev];
          syncToFirestore(updated);
          return updated;
        });
        soundEngine.playSuccess();
        setUploadSuccess(`Successfully stored "${file.name}" in Documents collection!`);
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setUploadError(err?.message || 'Error uploading document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Direct Photo Upload into AI Vault -> Photos
  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    soundEngine.playClick();
    setIsUploadingDoc(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const savedPhoto = await CameraService.uploadPhoto(
        file,
        file.name,
        { type: file.type, size: file.size },
        true,
        userId
      );
      soundEngine.playSuccess();
      setUploadSuccess(`Photo "${savedPhoto.name}" saved directly to AI Vault → Photos!`);
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setUploadError(err?.message || 'Error saving photo to Vault.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Download photo file
  const handleDownloadPhoto = (memory: MemoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playSuccess();
    const link = document.createElement('a');
    link.href = memory.sourceReference || '';
    link.download = `${memory.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rename photo title
  const handleRenamePhoto = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    soundEngine.playSuccess();
    const cleanTitle = newTitle.startsWith('Captured Photo:') ? newTitle : `Captured Photo: ${newTitle.trim()}`;
    setMemories((prev) => {
      const updated = prev.map((m) =>
        m.id === id ? { ...m, title: cleanTitle, updatedAt: new Date().toISOString() } : m
      );
      syncToFirestore(updated);
      try {
        localStorage.setItem(userVaultKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    window.dispatchEvent(new CustomEvent('vault_updated', { detail: { renamedId: id, newTitle } }));
  };

  // =========================================================================
  // ASK YOUR VAULT (AI KNOWLEDGE ASSISTANT GROUNDED IN MEMORIES)
  // =========================================================================

  const handleAskVault = async (customQ?: string) => {
    const qToAsk = customQ || askQuestion;
    if (!qToAsk.trim() || askingVault) return;

    soundEngine.playClick();
    setAskingVault(true);
    const newHistory = [...vaultChatHistory, { role: 'user' as const, content: qToAsk }];
    setVaultChatHistory(newHistory);
    setAskQuestion('');

    try {
      const res = await fetch('/api/vault/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qToAsk,
          memories,
          conversationHistory: newHistory.map((h) => ({ role: h.role, content: h.content })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setVaultChatHistory([
          ...newHistory,
          { role: 'assistant', content: data.answer, citations: data.citations },
        ]);
      } else {
        throw new Error(data.error || 'Failed to search vault.');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setVaultChatHistory([
        ...newHistory,
        {
          role: 'assistant',
          content: `Notice: ${err?.message || 'Vault assistant query failed.'}`,
        },
      ]);
    } finally {
      setAskingVault(false);
    }
  };

  // Export single memory
  const handleExportMemory = async (memory: MemoryItem, format: 'txt' | 'md' | 'docx' | 'pdf') => {
    soundEngine.playClick();
    const safeTitle = memory.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'docx') {
      const blob = await exportToDocx({ title: memory.title, content: memory.content, category: memory.collection });
      triggerFileDownload(blob, `${safeTitle}.docx`);
    } else if (format === 'pdf') {
      const blob = exportToPdf({ title: memory.title, content: memory.content, category: memory.collection });
      triggerFileDownload(blob, `${safeTitle}.pdf`);
    } else if (format === 'md') {
      const blob = new Blob([`# ${memory.title}\n\n${memory.content}`], { type: 'text/markdown;charset=utf-8' });
      triggerFileDownload(blob, `${safeTitle}.md`);
    } else {
      const blob = new Blob([`${memory.title}\n\n${memory.content}`], { type: 'text/plain;charset=utf-8' });
      triggerFileDownload(blob, `${safeTitle}.txt`);
    }
  };

  // Export full vault as JSON backup
  const handleExportVaultBackup = () => {
    soundEngine.playClick();
    const data = {
      vaultVersion: '1.0',
      exportedAt: new Date().toISOString(),
      memories,
      collections: customCollections,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    triggerFileDownload(blob, `AI_Memory_Vault_Backup_${Date.now()}.json`);
  };

  // Import vault backup
  const handleImportVaultBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEngine.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.memories)) {
          setMemories(parsed.memories);
          soundEngine.playSuccess();
          alert(`Successfully imported ${parsed.memories.length} memories into your vault!`);
        }
      } catch {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <ModalWrapper title="🧠 AI MEMORY VAULT" onClose={onClose} maxWidthClass="max-w-6xl">
      <div className="flex flex-col space-y-4 font-mono text-emerald-400 text-xs min-h-[620px]">

        {/* --- HEADER BAR --- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950 pb-3">
          <div>
            <h2 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-400" />
              AI MEMORY VAULT
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Your knowledge, organised and ready to explore.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleStartCreateMemory('note')}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Memory</span>
            </button>

            <label className="bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-300 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
              <Camera className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handlePhotoUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>

            <label className="bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-300 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
              <input
                type="file"
                accept=".pdf,.txt,.md,.csv,.docx,application/pdf,text/plain,text/markdown,text/csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>

            <button
              onClick={() => { soundEngine.playClick(); setNavTab('ask'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                navTab === 'ask'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'bg-black text-cyan-300 border border-cyan-900 hover:border-cyan-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Your Vault</span>
            </button>
          </div>
        </div>

        {/* Upload Status Banner */}
        {isUploadingDoc && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-xs flex items-center justify-between animate-pulse">
            <span>Extracting and indexing document text into your personal vault...</span>
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          </div>
        )}
        {uploadSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-200 rounded text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {uploadSuccess}
            </span>
            <button onClick={() => setUploadSuccess(null)} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {uploadError && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              {uploadError}
            </span>
            <button onClick={() => setUploadError(null)} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* --- MAIN WORKSPACE GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
          
          {/* SIDEBAR NAVIGATION */}
          <div className="space-y-4">
            <div className="bg-[#05080c] border border-emerald-950 rounded-lg p-2.5 space-y-1">
              {[
                { id: 'all', label: 'All Memories', icon: Layers, count: storageMetrics.count },
                { id: 'photo', label: 'Photos', icon: Camera, count: memories.filter((m) => !m.isTrashed && (m.type === 'photo' || m.collection?.toLowerCase() === 'photos')).length },
                { id: 'note', label: 'Notes', icon: FileText, count: memories.filter((m) => !m.isTrashed && m.type === 'note').length },
                { id: 'document', label: 'Documents', icon: BookOpen, count: memories.filter((m) => !m.isTrashed && m.type === 'document').length },
                { id: 'idea', label: 'Ideas', icon: Lightbulb, count: memories.filter((m) => !m.isTrashed && m.type === 'idea').length },
                { id: 'project', label: 'Projects', icon: Briefcase, count: memories.filter((m) => !m.isTrashed && m.type === 'project').length },
                { id: 'pinned', label: 'Pinned', icon: Pin, count: storageMetrics.pinnedCount },
                { id: 'ask', label: 'Ask Your Vault', icon: Sparkles, count: undefined },
                { id: 'trash', label: 'Trash', icon: Trash2, count: storageMetrics.trashCount },
              ].map((item) => {
                const IconComp = item.icon;
                const isActive = navTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      soundEngine.playClick();
                      setNavTab(item.id as VaultNavTab);
                      setSelectedCollection(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800'
                        : 'text-zinc-400 hover:bg-black hover:text-emerald-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      <span>{item.label}</span>
                    </span>
                    {item.count !== undefined && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Collections List */}
            <div className="bg-[#05080c] border border-emerald-950 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 px-1">
                <span className="flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5" /> COLLECTIONS
                </span>
              </div>
              <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                {customCollections.map((col) => (
                  <button
                    key={col}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedCollection(selectedCollection === col ? null : col);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-[11px] truncate flex items-center justify-between cursor-pointer ${
                      selectedCollection === col
                        ? 'bg-emerald-900/60 text-emerald-200 font-bold'
                        : 'text-zinc-400 hover:text-emerald-300 hover:bg-black'
                    }`}
                  >
                    <span>{col}</span>
                    <span className="text-[9px] text-zinc-600">
                      {memories.filter((m) => !m.isTrashed && m.collection === col).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Storage Usage Widget */}
            <div className="bg-[#05080c] border border-emerald-950 rounded-lg p-3 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between font-bold text-emerald-400">
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3" /> VAULT STORAGE
                </span>
                <span>{storageMetrics.kb} KB</span>
              </div>
              <div className="text-zinc-500 space-y-0.5">
                <div>Memories: {storageMetrics.count} records</div>
                <div>Word Count: {storageMetrics.words.toLocaleString()} words</div>
              </div>
              <div className="pt-2 border-t border-emerald-950/80 flex items-center justify-between gap-1">
                <button
                  onClick={handleExportVaultBackup}
                  className="text-zinc-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Backup
                </button>
                <label className="text-zinc-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer">
                  <Upload className="w-3 h-3" /> Import
                  <input type="file" accept=".json" onChange={handleImportVaultBackup} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="md:col-span-3 space-y-3 flex flex-col">
            
            {/* ============================================================= */}
            {/* VIEW 1: ASK YOUR VAULT CHAT INTERFACE */}
            {/* ============================================================= */}
            {navTab === 'ask' ? (
              <div className="bg-[#05080c] border border-cyan-950 rounded-lg p-4 space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-cyan-950 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-xs text-cyan-300 uppercase tracking-wider">
                      ASK YOUR VAULT — GROUNDED KNOWLEDGE ASSISTANT
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    Grounded strictly in your {storageMetrics.count} active memories
                  </span>
                </div>

                {/* Suggested Question Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-500 font-bold">Try asking:</span>
                  {[
                    'Summarise my project notes.',
                    'What ideas have I saved?',
                    'What milestones or decisions are recorded?',
                    'Create a checklist from my notes.',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAskVault(chip)}
                      className="text-[10px] bg-black border border-cyan-950 hover:border-cyan-600 text-zinc-300 px-2 py-1 rounded truncate max-w-[240px]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat History Box */}
                <div className="bg-black/90 border border-cyan-950 rounded-lg p-3 space-y-3 flex-1 max-h-[380px] overflow-y-auto">
                  {vaultChatHistory.length === 0 ? (
                    <div className="py-16 text-center text-zinc-600 space-y-2">
                      <Sparkles className="w-8 h-8 mx-auto text-zinc-700" />
                      <p className="font-bold text-zinc-400">ASK ANYTHING ABOUT YOUR STORED KNOWLEDGE</p>
                      <p className="text-[11px]">
                        The assistant retrieves passages from your notes and documents and provides direct citations.
                      </p>
                    </div>
                  ) : (
                    vaultChatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg text-xs leading-relaxed space-y-2 ${
                          msg.role === 'user'
                            ? 'bg-cyan-950/60 border border-cyan-800 text-cyan-100 self-end'
                            : 'bg-[#060a0f] border border-cyan-900/60 text-emerald-100 font-mono'
                        }`}
                      >
                        <div className="text-[10px] font-bold text-zinc-500 uppercase">
                          {msg.role === 'user' ? 'YOU' : 'AI VAULT ASSISTANT'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* Citations Badges */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="pt-2 border-t border-cyan-950 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-zinc-500 font-bold">CITATIONS:</span>
                            {msg.citations.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  const target = memories.find((m) => m.id === c.id);
                                  if (target) setViewingMemory(target);
                                }}
                                className="text-[10px] bg-cyan-950 border border-cyan-800 hover:border-cyan-400 text-cyan-300 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                              >
                                <span>{c.title}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Input Row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={askQuestion}
                    onChange={(e) => setAskQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskVault()}
                    placeholder="Ask a question about your saved notes, projects, and documents..."
                    className="flex-1 bg-black border border-cyan-900 rounded px-3 py-2 text-xs text-cyan-200 outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => handleAskVault()}
                    disabled={askingVault || !askQuestion.trim()}
                    className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-extrabold px-5 py-2 rounded text-xs transition-all shadow-md shadow-cyan-950 cursor-pointer"
                  >
                    {askingVault ? 'SEARCHING...' : 'ASK VAULT'}
                  </button>
                </div>
              </div>
            ) : (
              /* ============================================================= */
              /* VIEW 2: MEMORIES LIST & SEARCH */
              /* ============================================================= */
              <div className="space-y-3 flex-1 flex flex-col">
                {/* Search & Sort Bar */}
                <div className="bg-[#05080c] border border-emerald-950 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search titles, contents, tags..."
                      className="w-full bg-black border border-emerald-900 rounded pl-8 pr-3 py-1 text-xs text-emerald-200 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-black border border-emerald-900 rounded px-2.5 py-1 text-xs text-emerald-300 outline-none"
                    >
                      <option value="newest">Sort: Newest</option>
                      <option value="oldest">Sort: Oldest</option>
                      <option value="title">Sort: Title (A-Z)</option>
                    </select>

                    {selectedCollection && (
                      <span className="text-[10px] bg-emerald-950 border border-emerald-700 text-emerald-300 px-2 py-1 rounded flex items-center gap-1 font-bold">
                        <span>{selectedCollection}</span>
                        <button onClick={() => setSelectedCollection(null)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {selectedTag && (
                      <span className="text-[10px] bg-cyan-950 border border-cyan-700 text-cyan-300 px-2 py-1 rounded flex items-center gap-1 font-bold">
                        <span>#{selectedTag}</span>
                        <button onClick={() => setSelectedTag(null)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>

                {/* Tag Filter Strip */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 text-[10px]">
                    <span className="text-zinc-500 font-bold">Tags:</span>
                    {allTags.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          selectedTag === t
                            ? 'bg-emerald-500 text-black font-bold'
                            : 'bg-black text-zinc-400 border border-emerald-950 hover:border-emerald-800'
                        }`}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}

                {/* Memories Display: Dedicated Visual Photos Grid vs Generic Cards Grid */}
                {navTab === 'photo' ? (
                  <div className="space-y-3 flex-1 flex flex-col">
                    <div className="bg-[#05080c] border border-emerald-950 rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-emerald-200">PHOTOS VAULT</span>
                        <span className="text-[10px] text-zinc-500 font-mono">({displayedMemories.length} photos)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-300 font-bold px-2.5 py-1 rounded flex items-center gap-1.5 cursor-pointer transition-colors">
                          <Plus className="w-3 h-3 text-emerald-400" />
                          <span>Import Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handlePhotoUpload(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
                      {displayedMemories.length === 0 ? (
                        <div className="col-span-3 py-16 text-center text-zinc-600 space-y-3">
                          <div className="w-12 h-12 rounded-full border border-emerald-900/60 bg-emerald-950/20 flex items-center justify-center mx-auto text-emerald-400">
                            <Camera className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-300 text-xs">NO CAMERA PHOTOS IN VAULT</p>
                            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto mt-1">
                              Photos captured using the SUPERAI Camera automatically save here in high quality. Click the camera shutter to capture!
                            </p>
                          </div>
                        </div>
                      ) : (
                        displayedMemories.map((m, index) => {
                          const imgSrc = m.sourceReference || '';
                          return (
                            <div
                              key={m.id}
                              className="group relative bg-[#05080c] border border-emerald-950 hover:border-emerald-500 rounded-lg overflow-hidden flex flex-col justify-between transition-all"
                            >
                              {/* Photo Preview Container */}
                              <div
                                className="relative w-full h-36 bg-black overflow-hidden cursor-pointer"
                                onClick={() => setActivePhotoLightbox(m)}
                              >
                                {imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    style={getFilterStyle(m)}
                                    alt={m.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                    <ImageIcon className="w-8 h-8" />
                                  </div>
                                )}

                                {/* Quick Direct Delete Button on Card (Always visible, easy 1-click delete) */}
                                <button
                                  onClick={(e) => handleDeletePhoto(m, e)}
                                  title="Delete Photo"
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-rose-600 border border-rose-900/80 hover:border-rose-500 text-rose-400 hover:text-white transition-all shadow-md active:scale-90 z-20 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                <div className="absolute top-2 left-2 pointer-events-none z-10">
                                  <span className="text-[9px] bg-black/80 border border-emerald-900 text-emerald-300 font-mono px-1.5 py-0.5 rounded">
                                    {m.type === 'photo' ? 'PHOTO' : 'IMAGE'}
                                  </span>
                                </div>

                                {/* Hover actions toolbar */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActivePhotoLightbox(m);
                                    }}
                                    title="View Full Size"
                                    className="p-1.5 bg-black/80 hover:bg-emerald-600 text-white rounded border border-emerald-800 transition-all cursor-pointer"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDownloadPhoto(m, e)}
                                    title="Download Photo"
                                    className="p-1.5 bg-black/80 hover:bg-emerald-600 text-white rounded border border-emerald-800 transition-all cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRenamingPhoto({
                                        id: m.id,
                                        name: m.title.replace(/^Captured Photo:\s*/, ''),
                                      });
                                    }}
                                    title="Rename"
                                    className="p-1.5 bg-black/80 hover:bg-emerald-600 text-white rounded border border-emerald-800 transition-all cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeletePhoto(m, e)}
                                    title="Delete Photo"
                                    className="p-1.5 bg-black/80 hover:bg-rose-600 text-white rounded border border-rose-900 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
                                  </button>
                                </div>
                              </div>

                              {/* Card Metadata info */}
                              <div className="p-2.5 space-y-1 bg-[#05080c] border-t border-emerald-950">
                                <div
                                  onClick={() => setActivePhotoLightbox(m)}
                                  className="font-bold text-xs text-emerald-200 truncate cursor-pointer hover:text-emerald-400"
                                  title={m.title}
                                >
                                  {m.title}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                                  <span>{new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  <button
                                    onClick={(e) => handleTogglePin(m.id, e)}
                                    className="text-zinc-500 hover:text-emerald-400 p-0.5"
                                  >
                                    {m.isPinned ? <Pin className="w-3 h-3 text-emerald-400 fill-emerald-400" /> : <PinOff className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  /* Standard Memories Cards Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
                    {displayedMemories.length === 0 ? (
                      <div className="col-span-2 py-16 text-center text-zinc-600 space-y-2">
                        <FileText className="w-8 h-8 mx-auto text-zinc-700" />
                        <p className="font-bold text-zinc-400">NO MEMORIES FOUND</p>
                        <p className="text-[11px]">
                          {searchQuery ? `No records matched "${searchQuery}".` : 'Click "Add Memory" or "Upload Document" to start saving knowledge.'}
                        </p>
                      </div>
                    ) : (
                      displayedMemories.map((m, index) => (
                        <div
                          key={m.id}
                          onClick={() => setViewingMemory(m)}
                          className={`bg-[#05080c] border rounded-lg p-3.5 space-y-2.5 cursor-pointer transition-all hover:border-emerald-500 flex flex-col justify-between ${
                            m.isPinned ? 'border-emerald-700/80 bg-emerald-950/10' : 'border-emerald-950'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-xs text-emerald-200 line-clamp-1">{m.title}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {navTab !== 'trash' && (
                                  <button
                                    onClick={(e) => handleTogglePin(m.id, e)}
                                    className="text-zinc-500 hover:text-emerald-400 p-0.5"
                                    title={m.isPinned ? 'Unpin' : 'Pin'}
                                  >
                                    {m.isPinned ? <Pin className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /> : <PinOff className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                    m.type === 'project'
                                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                      : m.type === 'idea'
                                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                      : m.type === 'document'
                                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                      : m.type === 'photo'
                                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  }`}
                                >
                                  {m.type}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              {m.sourceReference && (m.type === 'photo' || m.sourceReference.startsWith('data:image') || m.sourceReference.startsWith('/uploads/') || m.sourceReference.includes('firebasestorage') || m.sourceReference.match(/\.(jpeg|jpg|gif|png|webp)$/i)) && (
                                <div className="w-16 h-16 shrink-0 rounded border border-emerald-900 overflow-hidden bg-black">
                                  <img 
                                    src={m.sourceReference} 
                                    style={getFilterStyle(m)}
                                    className="w-full h-full object-cover" 
                                    alt="Thumbnail" 
                                  />
                                </div>
                              )}
                              <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed flex-1">
                                {m.content}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-emerald-950 flex items-center justify-between text-[10px] text-zinc-500">
                            <span className="truncate max-w-[120px]">{m.collection}</span>
                            <div className="flex items-center gap-1">
                              {navTab === 'trash' ? (
                                <>
                                  <button
                                    onClick={(e) => handleRestoreFromTrash(m.id, e)}
                                    className="text-emerald-400 hover:underline flex items-center gap-0.5"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Restore
                                  </button>
                                  <button
                                    onClick={(e) => handlePermanentDelete(m.id, e)}
                                    className="text-red-400 hover:underline flex items-center gap-0.5 ml-2"
                                  >
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => handleDuplicateMemory(m, e)}
                                    className="hover:text-emerald-300 p-0.5"
                                    title="Duplicate"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => handleMoveToTrash(m.id, e)}
                                    className="hover:text-red-400 p-0.5 ml-1"
                                    title="Move to Trash"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ================================================================= */}
        {/* MODAL 1: CREATE / EDIT MEMORY FORM */}
        {/* ================================================================= */}
        {isEditing && activeMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#05080c] border border-emerald-500 rounded-lg p-5 w-full max-w-2xl space-y-4 shadow-xl shadow-emerald-950">
              <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                <span className="font-bold text-sm text-emerald-300">
                  {activeMemory.createdAt ? 'EDIT MEMORY' : 'ADD NEW MEMORY'}
                </span>
                <button
                  onClick={() => { setIsEditing(false); setActiveMemory(null); }}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMemory} className="space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-500 block font-bold">MEMORY TITLE:</label>
                  <input
                    type="text"
                    value={activeMemory.title || ''}
                    onChange={(e) => setActiveMemory({ ...activeMemory, title: e.target.value })}
                    placeholder="e.g. Project Roadmap & Key Milestones"
                    required
                    className="w-full bg-black border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-200 outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 block font-bold">TYPE:</label>
                    <select
                      value={activeMemory.type || 'note'}
                      onChange={(e) => setActiveMemory({ ...activeMemory, type: e.target.value as any })}
                      className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                    >
                      <option value="note">📝 Note</option>
                      <option value="idea">💡 Idea</option>
                      <option value="document">📄 Document</option>
                      <option value="project">💼 Project</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 block font-bold">COLLECTION:</label>
                    <select
                      value={activeMemory.collection || 'Personal Notes'}
                      onChange={(e) => setActiveMemory({ ...activeMemory, collection: e.target.value })}
                      className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                    >
                      {customCollections.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 block font-bold">MAIN CONTENT (MARKDOWN SUPPORTED):</label>
                  <textarea
                    rows={6}
                    value={activeMemory.content || ''}
                    onChange={(e) => setActiveMemory({ ...activeMemory, content: e.target.value })}
                    placeholder="Enter full notes, thoughts, tasks, research, or details..."
                    className="w-full bg-black border border-emerald-900 rounded p-2.5 text-xs text-emerald-200 outline-none leading-relaxed focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 block font-bold">TAGS (COMMA SEPARATED):</label>
                  <input
                    type="text"
                    value={activeMemory.tags?.join(', ') || ''}
                    onChange={(e) =>
                      setActiveMemory({
                        ...activeMemory,
                        tags: e.target.value
                          .split(',')
                          .map((t) => t.trim().toLowerCase())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g. security, roadmap, research"
                    className="w-full bg-black border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 block font-bold">OPTIONAL SOURCE / REFERENCE:</label>
                  <input
                    type="text"
                    value={activeMemory.sourceReference || ''}
                    onChange={(e) => setActiveMemory({ ...activeMemory, sourceReference: e.target.value })}
                    placeholder="e.g. Meeting Transcript, Book Chapter 2, URL"
                    className="w-full bg-black border border-emerald-900 rounded px-3 py-1.5 text-xs text-zinc-400 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!activeMemory.isPinned}
                      onChange={(e) => setActiveMemory({ ...activeMemory, isPinned: e.target.checked })}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs text-emerald-300">Pin to Top</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsEditing(false); setActiveMemory(null); }}
                      className="px-4 py-1.5 bg-black border border-emerald-950 text-zinc-400 hover:text-zinc-200 rounded text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded text-xs shadow-md shadow-emerald-950"
                    >
                      SAVE MEMORY
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL 2: VIEW MEMORY DETAILS DIALOG */}
        {/* ================================================================= */}
        {viewingMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#05080c] border border-emerald-500 rounded-lg p-5 w-full max-w-2xl space-y-4 shadow-xl shadow-emerald-950">
              <div className="flex items-start justify-between border-b border-emerald-950 pb-2 gap-2">
                <div>
                  <h3 className="font-bold text-sm text-emerald-200">{viewingMemory.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                    <span className="uppercase font-bold text-emerald-400">{viewingMemory.type}</span>
                    <span>•</span>
                    <span>{viewingMemory.collection}</span>
                    <span>•</span>
                    <span>{new Date(viewingMemory.updatedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setActiveMemory(viewingMemory);
                      setViewingMemory(null);
                      setIsEditing(true);
                    }}
                    className="p-1 bg-black border border-emerald-900 text-emerald-300 hover:border-emerald-500 rounded"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewingMemory(null)}
                    className="p-1 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Image Preview if applicable */}
              {viewingMemory.sourceReference && (viewingMemory.sourceReference.includes('firebasestorage') || viewingMemory.sourceReference.match(/\.(jpeg|jpg|gif|png|webp)$/i)) && (
                <div className="relative aspect-video bg-black rounded border border-emerald-900 overflow-hidden group mb-4">
                  <img 
                    src={viewingMemory.sourceReference} 
                    style={getFilterStyle(viewingMemory)}
                    className="w-full h-full object-contain" 
                    alt="Source reference" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a 
                      href={viewingMemory.sourceReference} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-emerald-500 text-black px-4 py-2 rounded-lg font-black text-[10px] flex items-center gap-2"
                    >
                      <ExternalLink className="w-3 h-3" /> OPEN ORIGINAL
                    </a>
                  </div>
                </div>
              )}

              {/* Memory Content */}
              <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto pr-1 font-mono bg-black/80 p-3 rounded border border-emerald-950">
                {viewingMemory.content}
              </div>

              {/* Tags & Source */}
              <div className="space-y-1.5 text-[11px]">
                {viewingMemory.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-500 font-bold">Tags:</span>
                    {viewingMemory.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-black border border-emerald-950 rounded text-emerald-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                {viewingMemory.sourceReference && (
                  <div className="text-zinc-500">
                    <span className="font-bold">Source Reference:</span> {viewingMemory.sourceReference}
                  </div>
                )}
              </div>

              {/* Footer Export & Action Row */}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-950">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold">Export:</span>
                  <button
                    onClick={() => handleExportMemory(viewingMemory, 'txt')}
                    className="text-[10px] bg-black border border-emerald-950 hover:border-emerald-700 px-2 py-0.5 rounded text-zinc-300"
                  >
                    .TXT
                  </button>
                  <button
                    onClick={() => handleExportMemory(viewingMemory, 'md')}
                    className="text-[10px] bg-black border border-emerald-950 hover:border-emerald-700 px-2 py-0.5 rounded text-zinc-300"
                  >
                    .MD
                  </button>
                  <button
                    onClick={() => handleExportMemory(viewingMemory, 'docx')}
                    className="text-[10px] bg-black border border-emerald-950 hover:border-emerald-700 px-2 py-0.5 rounded text-zinc-300"
                  >
                    .DOCX
                  </button>
                  <button
                    onClick={() => handleExportMemory(viewingMemory, 'pdf')}
                    className="text-[10px] bg-black border border-emerald-950 hover:border-emerald-700 px-2 py-0.5 rounded text-zinc-300"
                  >
                    .PDF
                  </button>
                </div>

                <button
                  onClick={() => setViewingMemory(null)}
                  className="px-4 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ================================================================= */}
        {/* MODAL 3: FULLSCREEN PHOTO LIGHTBOX */}
        {/* ================================================================= */}
        {activePhotoLightbox && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 bg-black/95 backdrop-blur-md">
            <div className="bg-[#05080c] border border-emerald-500 rounded-xl overflow-hidden max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-emerald-950/80">
              {/* Header */}
              <div className="p-3 border-b border-emerald-950 flex items-center justify-between bg-black/70">
                <div className="flex items-center gap-2 truncate pr-2">
                  <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-xs text-emerald-200 truncate">{activePhotoLightbox.title}</span>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {new Date(activePhotoLightbox.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setActivePhotoLightbox(null)}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-emerald-950/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image Viewport */}
              <div className="flex-1 bg-black/90 flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[300px]">
                {activePhotoLightbox.sourceReference ? (
                  <img
                    src={activePhotoLightbox.sourceReference}
                    style={getFilterStyle(activePhotoLightbox)}
                    alt={activePhotoLightbox.title}
                    className="max-h-[65vh] w-auto max-w-full object-contain rounded border border-emerald-950 shadow-lg"
                  />
                ) : (
                  <div className="text-zinc-600 flex flex-col items-center gap-2">
                    <ImageIcon className="w-12 h-12" />
                    <span className="text-xs">No image source available</span>
                  </div>
                )}
              </div>

              {/* Footer Toolbar */}
              <div className="p-3 border-t border-emerald-950 flex flex-wrap items-center justify-between gap-2 bg-black/80 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPhoto(activePhotoLightbox)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => {
                      setRenamingPhoto({
                        id: activePhotoLightbox.id,
                        name: activePhotoLightbox.title.replace(/^Captured Photo:\s*/, ''),
                      });
                    }}
                    className="bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-300 font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={() => handleTogglePin(activePhotoLightbox.id)}
                    className="bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-300 px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {activePhotoLightbox.isPinned ? <Pin className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /> : <PinOff className="w-3.5 h-3.5" />}
                    <span>{activePhotoLightbox.isPinned ? 'Pinned' : 'Pin'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleDeletePhoto(activePhotoLightbox);
                    }}
                    className="bg-rose-950/80 hover:bg-rose-600 border border-rose-700 hover:border-rose-500 text-rose-200 hover:text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-all shadow-md cursor-pointer font-bold text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Photo</span>
                  </button>
                  <button
                    onClick={() => setActivePhotoLightbox(null)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL 4: RENAME PHOTO MODAL */}
        {/* ================================================================= */}
        {renamingPhoto && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="bg-[#05080c] border border-emerald-500 rounded-lg p-4 w-full max-w-sm space-y-3 shadow-xl shadow-emerald-950">
              <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  RENAME PHOTO
                </span>
                <button onClick={() => setRenamingPhoto(null)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Photo Title</label>
                <input
                  type="text"
                  value={renamingPhoto.name}
                  onChange={(e) => setRenamingPhoto({ ...renamingPhoto, name: e.target.value })}
                  placeholder="e.g. Workspace Desk, Prototype Review"
                  className="w-full bg-black border border-emerald-900 rounded p-2 text-xs text-emerald-300 outline-none focus:border-emerald-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenamePhoto(renamingPhoto.id, renamingPhoto.name);
                      if (activePhotoLightbox && activePhotoLightbox.id === renamingPhoto.id) {
                        setActivePhotoLightbox({ ...activePhotoLightbox, title: renamingPhoto.name });
                      }
                      setRenamingPhoto(null);
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-950">
                <button
                  onClick={() => setRenamingPhoto(null)}
                  className="px-3 py-1 rounded bg-black border border-emerald-950 text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleRenamePhoto(renamingPhoto.id, renamingPhoto.name);
                    if (activePhotoLightbox && activePhotoLightbox.id === renamingPhoto.id) {
                      setActivePhotoLightbox({ ...activePhotoLightbox, title: renamingPhoto.name });
                    }
                    setRenamingPhoto(null);
                  }}
                  className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ModalWrapper>
  );
};
