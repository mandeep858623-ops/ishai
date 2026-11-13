import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const IS_VERCEL = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const DATA_DIR = IS_VERCEL
  ? path.join('/tmp', 'ishai-data')
  : path.join(process.cwd(), 'server', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const TOKEN_SECRET = process.env.SESSION_SECRET || process.env.GEMINI_API_KEY || 'ishai-os-session-fallback-v1';

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[AuthService] Unable to initialize data directory:', err);
  }
}

ensureDataDir();

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: 'user' | 'guest' | 'superai';
  createdAt: string;
  updatedAt: string;
}

interface StoredUser extends UserProfile {
  passwordHash: string;
  salt: string;
}

interface SessionRecord {
  token: string;
  uid: string;
  createdAt: string;
  expiresAt: string;
}

function loadUsers(): StoredUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('[AuthService] Failed to load users.json:', err);
  }
  return [];
}

function saveUsers(users: StoredUser[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AuthService] Failed to save users.json:', err);
  }
}

function loadSessions(): SessionRecord[] {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('[AuthService] Failed to load sessions.json:', err);
  }
  return [];
}

function saveSessions(sessions: SessionRecord[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AuthService] Failed to save sessions.json:', err);
  }
}

// Password Hashing Helper (PBKDF2 SHA-256 with random salt)
function hashPassword(password: string, saltHex?: string): { hash: string; salt: string } {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return { hash, salt };
}

function signStatelessToken(profile: UserProfile, expiresAtMs: number): string {
  const payload = Buffer.from(
    JSON.stringify({
      uid: profile.uid,
      fullName: profile.fullName,
      email: profile.email,
      role: profile.role,
      exp: expiresAtMs,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `ishai_v1.${payload}.${sig}`;
}

function verifyStatelessToken(token: string): UserProfile | null {
  if (!token.startsWith('ishai_v1.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, payload, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!parsed.uid || !parsed.exp || Date.now() > Number(parsed.exp)) return null;
    return {
      uid: parsed.uid,
      fullName: parsed.fullName || 'ISHAI User',
      email: parsed.email || '',
      role: parsed.role || 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Create Session Token
function createSession(profile: UserProfile): string {
  const now = new Date();
  const expiresAtMs = now.getTime() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const token = signStatelessToken(profile, expiresAtMs);
  const expiresAt = new Date(expiresAtMs).toISOString();
  const sessions = loadSessions().filter((s) => new Date(s.expiresAt) > new Date());
  sessions.push({
    token,
    uid: profile.uid,
    createdAt: now.toISOString(),
    expiresAt,
  });
  saveSessions(sessions);
  return token;
}

// Validate Session Token
export function verifySession(token?: string): UserProfile | null {
  if (!token) return null;
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

  // Special virtual guest & SuperAI tokens
  if (cleanToken.startsWith('guest_token_')) {
    const guestUid = cleanToken.replace('guest_token_', 'guest_');
    return {
      uid: guestUid,
      fullName: 'Guest User',
      email: 'guest@superai.local',
      role: 'guest',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (cleanToken === 'superai_master_token') {
    return {
      uid: 'superai_master_dev',
      fullName: 'SuperAI (Lead Developer)',
      email: 'superai@superai.os',
      role: 'superai',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Stateless HMAC token check works across ephemeral Vercel serverless lambdas
  const stateless = verifyStatelessToken(cleanToken);
  if (stateless) {
    const users = loadUsers();
    const user = users.find((u) => u.uid === stateless.uid);
    if (user) {
      const { passwordHash, salt, ...profile } = user;
      return profile;
    }
    return stateless;
  }

  const sessions = loadSessions();
  const session = sessions.find((s) => s.token === cleanToken && new Date(s.expiresAt) > new Date());
  if (!session) return null;

  const users = loadUsers();
  const user = users.find((u) => u.uid === session.uid);
  if (!user) return null;

  const { passwordHash, salt, ...profile } = user;
  return profile;
}

/**
 * SIGN UP USER
 */
export function signUpUser(params: {
  fullName: string;
  email: string;
  password: string;
}): { user: UserProfile; token: string } {
  const { fullName, email, password } = params;
  const cleanEmail = email.trim().toLowerCase();

  if (!fullName || !fullName.trim()) {
    throw new Error('Full Name is required.');
  }

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const users = loadUsers();
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error('An account with this email address already exists. Please sign in instead.');
  }

  const uid = 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();

  const newUser: StoredUser = {
    uid,
    fullName: fullName.trim(),
    email: cleanEmail,
    role: 'user',
    createdAt: now,
    updatedAt: now,
    passwordHash: hash,
    salt,
  };

  users.push(newUser);
  saveUsers(users);

  const { passwordHash: _, salt: __, ...profile } = newUser;
  const token = createSession(profile);

  return { user: profile, token };
}

/**
 * SIGN IN USER
 */
export function signInUser(params: {
  email: string;
  password: string;
}): { user: UserProfile; token: string } {
  const { email, password } = params;
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error('Email address and password are required.');
  }

  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    throw new Error('Invalid credentials. Please check your email and password.');
  }

  const { hash } = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    throw new Error('Invalid credentials. Please check your email and password.');
  }

  const { passwordHash: _, salt: __, ...profile } = user;
  const token = createSession(profile);

  return { user: profile, token };
}

/**
 * CONTINUE AS GUEST
 */
export function continueAsGuest(): { user: UserProfile; token: string } {
  const guestId = 'guest_' + Date.now();
  const token = 'guest_token_' + guestId;
  const user: UserProfile = {
    uid: guestId,
    fullName: 'Guest Visitor',
    email: 'guest@superai.local',
    role: 'guest',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { user, token };
}

/**
 * CONTINUE AS SUPERAI (DEVELOPER / MASTER MODE)
 */
export function continueAsSuperai(passcode?: string): { user: UserProfile; token: string } {
  if (passcode && passcode !== 'superai14') {
    throw new Error('Invalid developer passphrase supplied.');
  }

  const user: UserProfile = {
    uid: 'superai_master_dev',
    fullName: 'SuperAI (Master Architect)',
    email: 'superai@superai.os',
    role: 'superai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { user, token: 'superai_master_token' };
}

/**
 * UPDATE PROFILE
 */
export function updateProfile(uid: string, fullName: string): UserProfile {
  const users = loadUsers();
  const user = users.find((u) => u.uid === uid);
  if (!user) {
    throw new Error('User account not found.');
  }

  user.fullName = fullName.trim();
  user.updatedAt = new Date().toISOString();
  saveUsers(users);

  const { passwordHash: _, salt: __, ...profile } = user;
  return profile;
}

/**
 * CHANGE PASSWORD
 */
export function changePassword(uid: string, oldPass: string, newPass: string) {
  if (!newPass || newPass.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  const users = loadUsers();
  const user = users.find((u) => u.uid === uid);
  if (!user) {
    throw new Error('User account not found.');
  }

  const { hash: oldHash } = hashPassword(oldPass, user.salt);
  if (oldHash !== user.passwordHash) {
    throw new Error('Current password is incorrect.');
  }

  const { hash: newHash, salt: newSalt } = hashPassword(newPass);
  user.passwordHash = newHash;
  user.salt = newSalt;
  user.updatedAt = new Date().toISOString();
  saveUsers(users);
}
