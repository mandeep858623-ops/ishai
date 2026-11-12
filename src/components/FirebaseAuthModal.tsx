import React, { useState } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';
import { auth, db, handleFirestoreError, OperationType } from '../firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  Trash2,
  LogOut,
  Settings
} from 'lucide-react';

interface FirebaseAuthModalProps {
  onClose: () => void;
  onAuthSuccess: (user: any, token: string) => void;
  onSignOut?: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot' | 'settings';
  onLog?: (text: string, tag: string) => void;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({
  onClose,
  onAuthSuccess,
  onSignOut,
  initialMode = 'signin',
  onLog,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'settings'>(initialMode);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);


  // Sign In Handler using Firebase Auth
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await auth.signOut();
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      soundEngine.playSuccess();
      const profile = {
        uid: user.uid,
        fullName: user.displayName || email.split('@')[0],
        email: user.email,
        role: 'user',
      };
      if (onLog) onLog(`[FIREBASE_AUTH] Signed in successfully: ${email}`, 'SECURITY');
      onAuthSuccess(profile, await user.getIdToken());
      onClose();
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setErrorMsg(err?.message || 'Firebase Sign In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up Handler using Firebase Auth
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await auth.signOut();
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: fullName.trim() });
      
      soundEngine.playSuccess();
      const profile = {
        uid: user.uid,
        fullName: fullName.trim(),
        email: user.email,
        role: 'user',
      };
      if (onLog) onLog(`[FIREBASE_AUTH] Registered new account: ${email}`, 'SECURITY');
      onAuthSuccess(profile, await user.getIdToken());
      onClose();
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setErrorMsg(err?.message || 'Firebase Sign Up failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg(`Password recovery instructions sent to ${email}.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Password reset failed.');
    }
  };

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    soundEngine.playClick();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      soundEngine.playSuccess();
      const profile = {
        uid: user.uid,
        fullName: user.displayName || user.email?.split('@')[0] || 'Google User',
        email: user.email,
        role: 'user',
      };
      if (onLog) onLog(`[FIREBASE_AUTH] Signed in with Google: ${user.email}`, 'SECURITY');
      onAuthSuccess(profile, await user.getIdToken());
      onClose();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        soundEngine.playAlertBeep();
        setErrorMsg(err?.message || 'Google Sign In failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Out from within the modal
  const handleLocalSignOut = async () => {
    soundEngine.playClick();
    try {
      await auth.signOut();
      if (onSignOut) onSignOut();
      onClose();
    } catch (err: any) {
      setErrorMsg('Sign out failed: ' + err.message);
    }
  };

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    soundEngine.playAlertBeep();
    
    setIsLoading(true);
    setErrorMsg(null);

    const user = auth.currentUser;
    const uid = user.uid;

    try {
      // 1. Delete Firestore Data
      if (onLog) onLog(`[FIREBASE_AUTH] Purging data for UID: ${uid}`, 'DATABASE');
      
      try {
        await deleteDoc(doc(db, 'user_vault_records', uid));
        await deleteDoc(doc(db, 'user_focus_records', uid));
      } catch (dbErr) {
        console.warn('Non-fatal cleanup note:', dbErr);
      }

      // 2. Delete Auth Account
      await deleteUser(user);
      
      soundEngine.playSuccess();
      if (onLog) onLog(`[FIREBASE_AUTH] Account permanently deleted.`, 'SECURITY');
      
      if (onSignOut) onSignOut();
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        setErrorMsg('Security Requirement: Please re-authenticate before account deletion.');
      } else {
        setErrorMsg(err?.message || 'Deletion failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalWrapper title="🔥 FIREBASE SECURE AUTH" onClose={onClose} maxWidthClass="max-w-md">
      <div className="flex flex-col space-y-4 font-mono text-emerald-400 text-xs">

        {/* Tab Navigation Header */}
        <div className="flex items-center justify-around border-b border-emerald-950 pb-2 text-[11px]">
          {(!auth.currentUser || mode !== 'settings') && (
            <>
              <button
                onClick={() => { soundEngine.playClick(); setMode('signin'); setErrorMsg(null); }}
                className={`pb-1 font-bold transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'text-emerald-300 border-b-2 border-emerald-400 font-extrabold'
                    : 'text-zinc-500 hover:text-emerald-400'
                }`}
              >
                SIGN IN
              </button>
              <button
                onClick={() => { soundEngine.playClick(); setMode('signup'); setErrorMsg(null); }}
                className={`pb-1 font-bold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'text-emerald-300 border-b-2 border-emerald-400 font-extrabold'
                    : 'text-zinc-500 hover:text-emerald-400'
                }`}
              >
                CREATE ACCOUNT
              </button>
            </>
          )}
          {auth.currentUser && (
            <button
              onClick={() => { soundEngine.playClick(); setMode('settings'); setErrorMsg(null); }}
              className={`pb-1 font-bold transition-all cursor-pointer ${
                mode === 'settings'
                  ? 'text-emerald-300 border-b-2 border-emerald-400 font-extrabold'
                  : 'text-zinc-500 hover:text-emerald-400'
              }`}
            >
              ACCOUNT SETTINGS
            </button>
          )}
        </div>


        {/* Error and Success Alerts */}
        {errorMsg && (
          <div className="p-2.5 bg-red-950/80 border border-red-800 text-red-300 rounded text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              {errorMsg}
            </span>
            <button onClick={() => setErrorMsg(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-600 text-emerald-200 rounded text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-200 text-black font-bold py-2 rounded transition-all text-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.28-8.18 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-emerald-950"></div>
          <span className="text-[10px] text-zinc-600 font-bold uppercase">OR</span>
          <div className="flex-1 h-px bg-emerald-950"></div>
        </div>

        {/* SIGN IN */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-500 block font-bold">EMAIL ADDRESS:</label>
              <div className="relative mt-0.5">
                <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full bg-black border border-emerald-900 rounded pl-8 pr-3 py-1.5 text-xs text-emerald-200 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-zinc-500 font-bold">PASSWORD:</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[10px] text-emerald-500 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative mt-0.5">
                <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black border border-emerald-900 rounded pl-8 pr-8 py-1.5 text-xs text-emerald-200 outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-emerald-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2 rounded text-xs transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isLoading ? 'CONNECTING...' : 'SECURE SIGN IN'}</span>
            </button>
          </form>
        )}

        {/* SIGN UP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-500 block font-bold">FULL NAME:</label>
              <div className="relative mt-0.5">
                <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  required
                  className="w-full bg-black border border-emerald-900 rounded pl-8 pr-3 py-1.5 text-xs text-emerald-200 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 block font-bold">EMAIL ADDRESS:</label>
              <div className="relative mt-0.5">
                <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@domain.com"
                  required
                  className="w-full bg-black border border-emerald-900 rounded pl-8 pr-3 py-1.5 text-xs text-emerald-200 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 block font-bold">PASSWORD:</label>
              <div className="relative mt-0.5">
                <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full bg-black border border-emerald-900 rounded pl-8 pr-8 py-1.5 text-xs text-emerald-200 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 block font-bold">CONFIRM PASSWORD:</label>
              <div className="relative mt-0.5">
                <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  required
                  className="w-full bg-black border border-emerald-900 rounded pl-8 pr-3 py-1.5 text-xs text-emerald-200 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2 rounded text-xs transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isLoading ? 'REGISTERING...' : 'SECURE REGISTRATION'}</span>
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Enter your registered email address below. You will receive a secure password reset link.
            </p>

            <div>
              <label className="text-[10px] text-zinc-500 block font-bold">REGISTERED EMAIL:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                required
                className="w-full bg-black border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-200 outline-none focus:border-emerald-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2 rounded text-xs cursor-pointer"
            >
              SEND RESET INSTRUCTIONS
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-[10px] text-emerald-400 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ACCOUNT SETTINGS */}
        {mode === 'settings' && auth.currentUser && (
          <div className="space-y-6 py-2">
            <div className="bg-[#05080c] border border-emerald-950 rounded p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-300 truncate max-w-[200px]">
                    {auth.currentUser.displayName || 'ISHAN_USER'}
                  </div>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest">
                    {auth.currentUser.email}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-950 flex flex-col gap-2">
                <button
                  onClick={handleLocalSignOut}
                  className="w-full flex items-center justify-between px-3 py-2 bg-black hover:bg-zinc-900 border border-emerald-900/30 rounded text-[10px] text-emerald-400 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400" />
                    SIGN OUT FROM MAIN_FRAME
                  </span>
                  <div className="w-3 h-3 border-t-2 border-r-2 border-zinc-700 group-hover:border-emerald-400 rotate-45 transform" />
                </button>
              </div>
            </div>

            <div className="bg-red-950/10 border border-red-900/30 rounded p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Danger Zone: Permanent Account Purge</h4>
                  <p className="text-[9px] text-zinc-500 leading-relaxed">
                    Deleting your account will permanently erase your AI Memory Vault, Focus Studio stats, and all associated metadata. This action is irreversible.
                  </p>
                </div>
              </div>

              {!confirmDelete ? (
                <button
                  onClick={() => { soundEngine.playAlertBeep(); setConfirmDelete(true); }}
                  className="w-full py-2 bg-transparent border border-red-900/50 hover:bg-red-500/10 text-red-400 font-bold text-[10px] rounded transition-all uppercase flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  INITIATE ACCOUNT DELETION
                </button>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-[9px] text-red-300 font-bold text-center animate-pulse">
                    ⚠️ ARE YOU ABSOLUTELY SURE? DATA RECOVERY IS IMPOSSIBLE.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-2 bg-zinc-900 text-zinc-400 font-bold text-[10px] rounded"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] rounded shadow-lg shadow-red-900/40 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isLoading ? 'PURGING...' : 'YES, PURGE EVERYTHING'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </ModalWrapper>
  );
};
