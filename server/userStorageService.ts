import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'server', 'uploads');
const FILES_META_FILE = path.join(DATA_DIR, 'user_files.json');
const RECORDS_FILE = path.join(DATA_DIR, 'user_records.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export interface UserFileMeta {
  fileId: string;
  ownerUid: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  feature?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  recordId: string;
  ownerUid: string;
  recordType: string; // e.g. 'video', 'planner', 'coder', 'workflow', 'vault'
  title: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

function loadFilesMeta(): UserFileMeta[] {
  try {
    if (fs.existsSync(FILES_META_FILE)) {
      return JSON.parse(fs.readFileSync(FILES_META_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('[UserStorage] Failed to load user_files.json:', err);
  }
  return [];
}

function saveFilesMeta(files: UserFileMeta[]) {
  try {
    fs.writeFileSync(FILES_META_FILE, JSON.stringify(files, null, 2), 'utf-8');
  } catch (err) {
    console.error('[UserStorage] Failed to save user_files.json:', err);
  }
}

function loadRecords(): UserRecord[] {
  try {
    if (fs.existsSync(RECORDS_FILE)) {
      return JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('[UserStorage] Failed to load user_records.json:', err);
  }
  return [];
}

function saveRecords(records: UserRecord[]) {
  try {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('[UserStorage] Failed to save user_records.json:', err);
  }
}

/**
 * STORE USER UPLOADED FILE
 */
export function storeUserFile(params: {
  ownerUid: string;
  fileName: string;
  fileBuffer: Buffer;
  feature?: string;
}): UserFileMeta {
  const { ownerUid, fileName, fileBuffer, feature } = params;

  // Create isolated user directory
  const userDir = path.join(UPLOADS_DIR, ownerUid);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const ext = path.extname(fileName) || '.bin';
  const diskFileName = `${fileId}${ext}`;
  const diskFilePath = path.join(userDir, diskFileName);

  fs.writeFileSync(diskFilePath, fileBuffer);

  const now = new Date().toISOString();
  const fileMeta: UserFileMeta = {
    fileId,
    ownerUid,
    fileName,
    fileType: ext.replace('.', '').toUpperCase(),
    fileSize: fileBuffer.length,
    storagePath: diskFilePath,
    feature: feature || 'My Files',
    createdAt: now,
    updatedAt: now,
  };

  const files = loadFilesMeta();
  files.push(fileMeta);
  saveFilesMeta(files);

  return fileMeta;
}

/**
 * GET USER FILES (STRICT OWNER ISOLATION)
 */
export function getUserFiles(ownerUid: string): UserFileMeta[] {
  const files = loadFilesMeta();
  return files.filter((f) => f.ownerUid === ownerUid);
}

/**
 * GET FILE FOR DOWNLOAD / PREVIEW (STRICT OWNER VALIDATION)
 */
export function getUserFileForDownload(ownerUid: string, fileId: string): UserFileMeta {
  const files = loadFilesMeta();
  const file = files.find((f) => f.fileId === fileId);
  if (!file) {
    throw new Error('File not found.');
  }

  if (file.ownerUid !== ownerUid) {
    throw new Error('Access denied. You do not own this file.');
  }

  if (!fs.existsSync(file.storagePath)) {
    throw new Error('File storage binary missing on server.');
  }

  return file;
}

/**
 * RENAME USER FILE (STRICT OWNER VALIDATION)
 */
export function renameUserFile(ownerUid: string, fileId: string, newName: string): UserFileMeta {
  const files = loadFilesMeta();
  const file = files.find((f) => f.fileId === fileId);
  if (!file) {
    throw new Error('File not found.');
  }

  if (file.ownerUid !== ownerUid) {
    throw new Error('Access denied. You do not own this file.');
  }

  file.fileName = newName.trim();
  file.updatedAt = new Date().toISOString();
  saveFilesMeta(files);

  return file;
}

/**
 * DELETE USER FILE (STRICT OWNER VALIDATION)
 */
export function deleteUserFile(ownerUid: string, fileId: string) {
  const files = loadFilesMeta();
  const index = files.findIndex((f) => f.fileId === fileId);
  if (index === -1) {
    throw new Error('File not found.');
  }

  const file = files[index];
  if (file.ownerUid !== ownerUid) {
    throw new Error('Access denied. You do not own this file.');
  }

  // Remove physical file from disk
  if (fs.existsSync(file.storagePath)) {
    try {
      fs.unlinkSync(file.storagePath);
    } catch (e) {
      console.warn('[UserStorage] Failed to unlink file:', e);
    }
  }

  files.splice(index, 1);
  saveFilesMeta(files);
}

/**
 * SAVE FEATURE USER RECORD
 */
export function saveUserRecord(ownerUid: string, recordType: string, title: string, data: any): UserRecord {
  const records = loadRecords();
  const recordId = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const record: UserRecord = {
    recordId,
    ownerUid,
    recordType,
    title,
    data,
    createdAt: now,
    updatedAt: now,
  };

  records.push(record);
  saveRecords(records);
  return record;
}

/**
 * GET USER RECORDS FOR FEATURE
 */
export function getUserRecords(ownerUid: string, recordType?: string): UserRecord[] {
  const records = loadRecords();
  return records.filter((r) => r.ownerUid === ownerUid && (!recordType || r.recordType === recordType));
}

/**
 * DELETE USER RECORD
 */
export function deleteUserRecord(ownerUid: string, recordId: string) {
  const records = loadRecords();
  const index = records.findIndex((r) => r.recordId === recordId);
  if (index === -1) throw new Error('Record not found.');
  if (records[index].ownerUid !== ownerUid) throw new Error('Access denied.');

  records.splice(index, 1);
  saveRecords(records);
}
