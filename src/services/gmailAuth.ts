import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// In-memory token storage (NEVER store access tokens in localStorage/sessionStorage)
let cachedGmailAccessToken: string | null = null;
let cachedGmailUser: User | null = null;

// Initialize Google OAuth Provider with required Gmail scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://mail.google.com/');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.compose');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.modify');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.labels');
googleProvider.setCustomParameters({
  prompt: 'select_account consent',
  access_type: 'offline'
});

// Clear cached token on auth state change
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedGmailAccessToken = null;
    cachedGmailUser = null;
  } else {
    cachedGmailUser = user;
  }
});

/**
 * Connects the current user's Google Account via OAuth 2.0 popup
 */
export async function connectGmailAccount(): Promise<{
  user: User;
  accessToken: string;
  email: string;
  displayName: string;
  photoURL: string;
}> {
  try {
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'offline'
    });
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Google OAuth failed: Access token was not issued.');
    }

    cachedGmailAccessToken = credential.accessToken;
    cachedGmailUser = result.user;

    return {
      user: result.user,
      accessToken: credential.accessToken,
      email: result.user.email || '',
      displayName: result.user.displayName || 'Gmail User',
      photoURL: result.user.photoURL || ''
    };
  } catch (error: any) {
    console.error('Connect Gmail OAuth error details:', {
      code: error?.code,
      message: error?.message,
      email: auth.currentUser?.email,
      stack: error?.stack
    });
    throw new Error(error?.message || 'Failed to authenticate with Google OAuth.');
  }
}

/**
 * Disconnects the Gmail account and clears cached OAuth tokens
 */
export async function disconnectGmailAccount(): Promise<void> {
  cachedGmailAccessToken = null;
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Firebase signout warning:', err);
  }
}

/**
 * Returns current cached OAuth token or null
 */
export function getGmailAccessToken(): string | null {
  return cachedGmailAccessToken;
}

/**
 * Sets cached OAuth token in-memory (e.g. from session restoration)
 */
export function setGmailAccessToken(token: string | null): void {
  cachedGmailAccessToken = token;
}

/**
 * Returns current authenticated user
 */
export function getGmailUser(): User | null {
  return cachedGmailUser || auth.currentUser;
}
