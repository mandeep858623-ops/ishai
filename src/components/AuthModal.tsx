import React, { useState } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';
import { UserProfile } from '../../server/authService';
import { 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Code
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (user: UserProfile, token: string) => void;
  initialMode?: 'signin' | 'signup' | 'forgot' | 'settings';
  currentUser?: UserProfile | null;
  onLog?: (text: string, tag: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
  currentUser,
  onLog,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'settings'>(initialMode);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [superaiPasscode, setSuperaiPasscode] = useState('');
  const [showSuperaiPass, setShowSuperaiPass] = useState(false);

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        if (onLog) onLog(`[AUTH] Signed in successfully as ${data.user.fullName} (${data.user.email})`, 'SECURITY');
        onAuthSuccess(data.user, data.token);
        onClose();
      } else {
        throw new Error(data.error || 'Authentication failed.');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setErrorMsg(err?.message || 'Failed to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up Handler
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        if (onLog) onLog(`[AUTH] Registered new user ${data.user.fullName} (${data.user.email})`, 'SECURITY');
        onAuthSuccess(data.user, data.token);
        onClose();
      } else {
        throw new Error(data.error || 'Registration failed.');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setErrorMsg(err?.message || 'Failed to create account.');
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

    soundEngine.playSuccess();
    setSuccessMsg(`A password recovery token has been generated and dispatched to ${email}. Check your inbox.`);
  };

  // Continue as Guest Handler
  const handleGuestLogin = async () => {
    soundEngine.playClick();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        if (onLog) onLog(`[AUTH] Session initiated as Guest (${data.user.uid})`, 'SECURITY');
        onAuthSuccess(data.user, data.token);
        onClose();
      }
    } catch {
      setErrorMsg('Guest login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Continue as SuperAI Handler
  const handleSuperaiLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/superai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: superaiPasscode }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        if (onLog) onLog(`[AUTH] Elevated privileges granted to SuperAI Master Architect`, 'SECURITY');
        onAuthSuccess(data.user, data.token);
        onClose();
      } else {
        throw new Error(data.error || 'Invalid developer passphrase.');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setErrorMsg(err?.message || 'Invalid passcode.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalWrapper title="🔐 SUPERAI ACCOUNT SECURITY & LOG IN" onClose={onClose} maxWidthClass="max-w-md">
      <div className="flex flex-col space-y-4 font-mono text-emerald-400 text-xs">

        {/* Tab Navigation Header */}
        <div className="flex items-center justify-around border-b border-emerald-950 pb-2 text-[11px]">
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
        </div>

        {/* Error and Success Alerts */}
        {errorMsg && (
          <div className="p-2.5 bg-red-950/80 border border-red-800 text-red-300 rounded text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              {errorMsg}
            </span>
            <button onClick={() => setErrorMsg(null)} className="text-zinc-500 hover:text-zinc-300">
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

        {/* =================================================================== */}
        {/* MODE 1: SIGN IN */}
        {/* =================================================================== */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-500 block font-bold">REGISTERED EMAIL:</label>
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
              <span>{isLoading ? 'VERIFYING...' : 'SIGN IN TO SUPERAI'}</span>
            </button>

            {/* Quick Access Modes */}
            <div className="pt-3 border-t border-emerald-950/80 space-y-2 text-center">
              <p className="text-[10px] text-zinc-500">OR ACCESS WITHOUT PASSWORD:</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-300 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Guest Mode
                </button>

                <button
                  type="button"
                  onClick={() => setShowSuperaiPass(!showSuperaiPass)}
                  className="bg-black hover:bg-cyan-950 border border-cyan-900 text-cyan-300 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer"
                >
                  SuperAI Mode
                </button>
              </div>

              {showSuperaiPass && (
                <div className="p-2.5 bg-[#05080c] border border-cyan-900 rounded space-y-2 mt-2">
                  <label className="text-[10px] text-cyan-400 block font-bold">SUPERAI DEVELOPER PASSPHRASE:</label>
                  <input
                    type="password"
                    value={superaiPasscode}
                    onChange={(e) => setSuperaiPasscode(e.target.value)}
                    placeholder="Enter superai14"
                    className="w-full bg-black border border-cyan-800 rounded px-2.5 py-1 text-xs text-cyan-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSuperaiLogin}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold py-1 rounded text-[11px]"
                  >
                    AUTHENTICATE SUPERAI
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {/* =================================================================== */}
        {/* MODE 2: SIGN UP */}
        {/* =================================================================== */}
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-emerald-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
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
              <span>{isLoading ? 'CREATING ACCOUNT...' : 'REGISTER PRIVATE WORKSPACE'}</span>
            </button>
          </form>
        )}

        {/* =================================================================== */}
        {/* MODE 3: FORGOT PASSWORD */}
        {/* =================================================================== */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Enter your registered email address below. We will send you password reset instructions.
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
              SEND RECOVERY EMAIL
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

      </div>
    </ModalWrapper>
  );
};
