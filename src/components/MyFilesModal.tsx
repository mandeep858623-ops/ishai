import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';
import { UserFileMeta } from '../../server/userStorageService';
import { UserProfile } from '../../server/authService';
import { 
  Folder, 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Edit2, 
  Trash2, 
  Eye, 
  File, 
  FileCode, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle, 
  Lock, 
  HardDrive
} from 'lucide-react';

interface MyFilesModalProps {
  onClose: () => void;
  currentUser: UserProfile;
  authToken: string;
  onLog?: (text: string, tag: string) => void;
}

export const MyFilesModal: React.FC<MyFilesModalProps> = ({
  onClose,
  currentUser,
  authToken,
  onLog,
}) => {
  const [files, setFiles] = useState<UserFileMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Rename modal state
  const [renamingFile, setRenamingFile] = useState<UserFileMeta | null>(null);
  const [newName, setNewName] = useState('');

  // Preview file state
  const [previewingFile, setPreviewingFile] = useState<UserFileMeta | null>(null);

  // Load User Files from Backend API (strictly user scoped)
  const fetchUserFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/files', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFiles(data.files || []);
      }
    } catch (err: any) {
      console.warn('[MyFiles] Error fetching files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFiles();
  }, [authToken]);

  // Upload File Handler
  const handleUploadFile = async (file: File) => {
    if (!file) return;
    soundEngine.playClick();
    setIsUploading(true);
    setUploadError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const res = await fetch('/api/user/files/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          base64,
          feature: 'My Files Workspace',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        if (onLog) onLog(`[STORAGE] Uploaded file "${file.name}" to private user storage`, 'DATABASE');
        fetchUserFiles();
      } else {
        throw new Error(data.error || 'Upload failed.');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setUploadError(err?.message || 'File upload error.');
    } finally {
      setIsUploading(false);
    }
  };

  // Rename File Handler
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFile || !newName.trim()) return;

    soundEngine.playClick();
    try {
      const res = await fetch(`/api/user/files/${renamingFile.fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ newName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setRenamingFile(null);
        fetchUserFiles();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert(err?.message || 'Rename failed');
    }
  };

  // Delete File Handler
  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;
    soundEngine.playClick();

    try {
      const res = await fetch(`/api/user/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        fetchUserFiles();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
    }
  };

  // Download File Handler
  const handleDownload = (fileId: string, fileName: string) => {
    soundEngine.playClick();
    const link = document.createElement('a');
    link.href = `/api/user/files/download/${fileId}?token=${encodeURIComponent(authToken)}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered and Sorted Files
  const filteredFiles = files
    .filter((f) => {
      if (typeFilter !== 'all') {
        const ext = f.fileType.toLowerCase();
        if (typeFilter === 'pdf' && ext !== 'pdf') return false;
        if (typeFilter === 'doc' && !['doc', 'docx'].includes(ext)) return false;
        if (typeFilter === 'code' && !['js', 'ts', 'py', 'json', 'html', 'css'].includes(ext)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return f.fileName.toLowerCase().includes(q) || f.fileType.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.fileName.localeCompare(b.fileName);
      if (sortBy === 'size') return b.fileSize - a.fileSize;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <ModalWrapper title="📁 MY PRIVATE FILES WORKSPACE" onClose={onClose} maxWidthClass="max-w-5xl">
      <div className="flex flex-col space-y-4 font-mono text-emerald-400 text-xs min-h-[550px]">

        {/* Header Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950 pb-3">
          <div>
            <h2 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              PRIVATE FILE STORAGE — {currentUser.fullName.toUpperCase()}
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Encrypted user partition (`/server/uploads/{currentUser.uid}`). Authenticated server isolation.
            </p>
          </div>

          <label className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-4 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleUploadFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>
        </div>

        {/* Upload Alert */}
        {isUploading && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-xs flex items-center justify-between animate-pulse">
            <span>Encrypting and uploading file to your isolated server partition...</span>
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          </div>
        )}
        {uploadError && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              {uploadError}
            </span>
            <button onClick={() => setUploadError(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="bg-[#05080c] border border-emerald-950 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your private files..."
              className="w-full bg-black border border-emerald-900 rounded pl-8 pr-3 py-1.5 text-xs text-emerald-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
            >
              <option value="all">All File Types</option>
              <option value="pdf">PDF Documents</option>
              <option value="doc">Word / Text</option>
              <option value="code">Source Code</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
            >
              <option value="date">Sort: Upload Date</option>
              <option value="name">Sort: File Name</option>
              <option value="size">Sort: File Size</option>
            </select>
          </div>
        </div>

        {/* Files Grid / List */}
        <div className="flex-1 bg-[#05080c] border border-emerald-950 rounded-lg p-3 overflow-y-auto max-h-[380px]">
          {isLoading ? (
            <div className="py-16 text-center text-zinc-500 space-y-2">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-500" />
              <p>Fetching your authenticated file directory...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-16 text-center text-zinc-600 space-y-2">
              <Folder className="w-10 h-10 mx-auto text-zinc-700" />
              <p className="font-bold text-zinc-400">NO PRIVATE FILES FOUND</p>
              <p className="text-[11px]">
                {searchQuery ? `No files match "${searchQuery}".` : 'Click "Upload File" above to store files in your private user vault.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredFiles.map((f) => (
                <div
                  key={f.fileId}
                  className="bg-black border border-emerald-950 hover:border-emerald-600 rounded-lg p-3 space-y-2 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-emerald-200 truncate">{f.fileName}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                        {f.fileType}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-500 space-y-0.5">
                      <div>Size: {(f.fileSize / 1024).toFixed(1)} KB</div>
                      <div>Uploaded: {new Date(f.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-950 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => handleDownload(f.fileId, f.fileName)}
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>

                    <div className="flex items-center gap-2 text-zinc-400">
                      <button
                        onClick={() => { setRenamingFile(f); setNewName(f.fileName); }}
                        className="hover:text-emerald-300"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(f.fileId, f.fileName)}
                        className="hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rename File Dialog */}
        {renamingFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#05080c] border border-emerald-500 rounded-lg p-4 w-full max-w-sm space-y-3">
              <h3 className="font-bold text-xs text-emerald-300">RENAME FILE</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-black border border-emerald-800 rounded px-2.5 py-1.5 text-xs text-emerald-200 outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  className="px-3 py-1 bg-black text-zinc-400 text-xs rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRename}
                  className="px-4 py-1 bg-emerald-500 text-black font-extrabold text-xs rounded"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ModalWrapper>
  );
};
