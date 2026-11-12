import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Send, Paperclip, X, Check, AlertCircle, RefreshCw, LogOut,
  Sparkles, Layers, FileText, CheckCircle2, ShieldCheck, UserCheck,
  AlignLeft, Bold, Italic, List, CornerDownLeft, Eye, Clock, Trash2
} from 'lucide-react';
import { connectGmailAccount, disconnectGmailAccount, getGmailAccessToken, setGmailAccessToken } from '../../services/gmailAuth';
import { sendGmailApiEmail, saveGmailApiDraft, fetchGmailUserProfile, fetchGmailSentMessages, fetchGmailInboxMessages, EmailAttachment, GmailMessageSummary } from '../../services/gmailApiService';
import { aiAssistEmailDraft, aiImproveEmail } from '../../services/gmailAiService';
import { soundEngine } from '../../utils/audio';

interface GmailConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  writeLog: (text: string, tag?: string) => void;
}

export const GmailConnectModal: React.FC<GmailConnectModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  writeLog
}) => {
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(getGmailAccessToken());
  const [userProfile, setUserProfile] = useState<{
    email: string;
    displayName: string;
    photoURL: string;
    messagesTotal?: number;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'compose' | 'inbox' | 'sent' | 'ai_assistant'>('compose');

  // Composer State
  const [toInput, setToInput] = useState('');
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [ccInput, setCcInput] = useState('');
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [showBcc, setShowBcc] = useState(false);
  const [bccInput, setBccInput] = useState('');
  const [bccRecipients, setBccRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);

  // Sending & Validation State
  const [isSending, setIsSending] = useState(false);
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);
  const [sendSuccessReceipt, setSendSuccessReceipt] = useState<{
    id: string;
    threadId: string;
    to: string[];
    subject: string;
    time: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Assistant Modal State
  const [showAiDraftModal, setShowAiDraftModal] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState('');
  const [aiRecipientName, setAiRecipientName] = useState('');
  const [aiTone, setAiTone] = useState<'Formal' | 'Friendly' | 'Persuasive' | 'Executive' | 'Urgent'>('Formal');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Messages List State
  const [sentMessages, setSentMessages] = useState<GmailMessageSummary[]>([]);
  const [inboxMessages, setInboxMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Check existing token or load profile on open
  useEffect(() => {
    const token = getGmailAccessToken();
    if (token) {
      setAccessToken(token);
      setIsConnected(true);
      loadProfile(token);
    }
  }, [isOpen]);

  const loadProfile = async (token: string) => {
    try {
      const profile = await fetchGmailUserProfile(token);
      if (profile) {
        setUserProfile((prev) => ({
          email: profile.emailAddress,
          displayName: currentUser?.displayName || prev?.displayName || profile.emailAddress.split('@')[0],
          photoURL: currentUser?.photoURL || prev?.photoURL || '',
          messagesTotal: profile.messagesTotal
        }));
        writeLog(`Gmail Connected: ${profile.emailAddress}`, 'GMAIL');
      }
    } catch (err: any) {
      console.warn('Load profile error:', err);
    }
  };

  const handleConnectGmail = async () => {
    soundEngine.playClick();
    setIsConnecting(true);
    setErrorMessage(null);
    writeLog('Initiating Google OAuth connection...', 'GMAIL');
    try {
      const res = await connectGmailAccount();
      writeLog(`OAuth callback successful for: ${res.email}`, 'GMAIL');
      setAccessToken(res.accessToken);
      setIsConnected(true);
      setUserProfile({
        email: res.email,
        displayName: res.displayName,
        photoURL: res.photoURL
      });
      writeLog(`Profile loaded successfully.`, 'GMAIL');
      soundEngine.playSuccess();
      loadProfile(res.accessToken);
    } catch (err: any) {
      console.error('Connect Gmail error details:', {
        code: err?.code,
        message: err?.message,
        stack: err?.stack
      });
      writeLog(`Connection failed: ${err?.message || 'Unknown error'}`, 'GMAIL');
      setErrorMessage(err?.message || 'Google OAuth sign in was cancelled or failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    soundEngine.playClick();
    await disconnectGmailAccount();
    setIsConnected(false);
    setAccessToken(null);
    setUserProfile(null);
    setSentMessages([]);
    setInboxMessages([]);
    writeLog('Gmail account disconnected. OAuth token cleared from memory.', 'GMAIL');
  };

  // Recipient chip helpers
  const handleAddToRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const email = toInput.trim().replace(/,/g, '');
      if (email && /\S+@\S+\.\S+/.test(email)) {
        if (!toRecipients.includes(email)) {
          setToRecipients((prev) => [...prev, email]);
        }
        setToInput('');
      }
    }
  };

  const handleAddCcRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const email = ccInput.trim().replace(/,/g, '');
      if (email && /\S+@\S+\.\S+/.test(email)) {
        if (!ccRecipients.includes(email)) {
          setCcRecipients((prev) => [...prev, email]);
        }
        setCcInput('');
      }
    }
  };

  const handleAddBccRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const email = bccInput.trim().replace(/,/g, '');
      if (email && /\S+@\S+\.\S+/.test(email)) {
        if (!bccRecipients.includes(email)) {
          setBccRecipients((prev) => [...prev, email]);
        }
        setBccInput('');
      }
    }
  };

  // File Attachment Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Clean = result.replace(/^data:.*?;base64,/, '');
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64Data: base64Clean,
            sizeBytes: file.size
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Pre-Send Validation
  const handleValidateAndPreSend = () => {
    setErrorMessage(null);
    setSendSuccessReceipt(null);

    // Make sure pending typing input is added
    let finalTo = [...toRecipients];
    if (toInput.trim() && /\S+@\S+\.\S+/.test(toInput.trim())) {
      finalTo.push(toInput.trim());
      setToRecipients(finalTo);
      setToInput('');
    }

    if (finalTo.length === 0) {
      setErrorMessage('Please enter at least one valid recipient email address in the "To" field.');
      return;
    }

    if (!subject.trim()) {
      setErrorMessage('Please enter a subject line for your email.');
      return;
    }

    if (!bodyHtml.trim()) {
      setErrorMessage('Please enter message content in the email body.');
      return;
    }

    if (!isConnected || !accessToken) {
      setErrorMessage('Please connect your Gmail account using Google OAuth first.');
      return;
    }

    // Open confirmation modal
    setShowConfirmSendModal(true);
    soundEngine.playClick();
  };

  // Execute Actual Gmail API Send
  const handleExecuteRealSend = async () => {
    setShowConfirmSendModal(false);
    setIsSending(true);
    setErrorMessage(null);
    soundEngine.playClick();

    try {
      const result = await sendGmailApiEmail(
        accessToken!,
        {
          to: toRecipients,
          cc: ccRecipients,
          bcc: bccRecipients,
          subject,
          bodyHtml: bodyHtml.includes('<p>') ? bodyHtml : `<p>${bodyHtml.replace(/\n/g, '<br/>')}</p>`,
          attachments
        },
        userProfile?.email || 'me'
      );

      soundEngine.playSuccess();
      setSendSuccessReceipt({
        id: result.id,
        threadId: result.threadId,
        to: toRecipients,
        subject,
        time: new Date().toLocaleTimeString()
      });

      writeLog(`Email successfully delivered via Gmail API! Message ID: ${result.id}`, 'GMAIL');

      // Reset composer
      setToRecipients([]);
      setCcRecipients([]);
      setBccRecipients([]);
      setSubject('');
      setBodyHtml('');
      setAttachments([]);
    } catch (err: any) {
      console.error('Real Gmail Send error:', err);
      soundEngine.playAlertBeep();
      setErrorMessage(err?.message || 'Failed to deliver email through Gmail API.');
    } finally {
      setIsSending(false);
    }
  };

  // Generate AI Draft
  const handleGenerateAiDraft = async () => {
    if (!aiPromptTopic.trim()) return;
    setIsGeneratingAi(true);
    try {
      const draft = await aiAssistEmailDraft({
        topic: aiPromptTopic,
        recipientName: aiRecipientName,
        tone: aiTone
      });
      setSubject(draft.subject);
      setBodyHtml(draft.bodyHtml);
      setShowAiDraftModal(false);
      setAiPromptTopic('');
      soundEngine.playSuccess();
      writeLog(`AI Email Assistant generated draft for topic: "${aiPromptTopic.slice(0, 30)}..."`, 'AI');
    } catch (err) {
      console.error('AI Draft generation failed:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // AI Subject Line Suggestion
  const handleAiSuggestSubject = async () => {
    if (!bodyHtml.trim()) return;
    try {
      const suggestions = await aiImproveEmail({
        text: bodyHtml,
        action: 'subject_suggestions'
      });
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        setSubject(suggestions[0]);
        soundEngine.playSuccess();
      }
    } catch (err) {
      console.warn('AI Subject suggest failed:', err);
    }
  };

  // Load Sent / Inbox Messages
  const handleLoadMessages = async (tab: 'sent' | 'inbox') => {
    setActiveTab(tab);
    if (!accessToken) return;
    setIsLoadingMessages(true);
    try {
      if (tab === 'sent') {
        const msgs = await fetchGmailSentMessages(accessToken);
        setSentMessages(msgs);
      } else {
        const msgs = await fetchGmailInboxMessages(accessToken);
        setInboxMessages(msgs);
      }
    } catch (err) {
      console.warn('Fetch messages error:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#090b0e] border border-cyan-500/40 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_60px_rgba(6,182,212,0.15)] text-zinc-100 font-sans">

        {/* --- WORKSPACE HEADER --- */}
        <div className="px-5 py-3.5 bg-[#0e121a] border-b border-cyan-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                ISHAI GMAIL CONNECT
                <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Official Gmail API Integration
                </span>
              </h2>
              <p className="text-[11px] text-cyan-400/70 font-mono">Secure Google OAuth 2.0 Email Workspace</p>
            </div>
          </div>

          {/* Connection Profile / Switch / Disconnect */}
          <div className="flex items-center gap-3">
            {isConnected && userProfile ? (
              <div className="flex items-center gap-2 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl">
                {userProfile.photoURL ? (
                  <img src={userProfile.photoURL} alt="Avatar" className="w-6 h-6 rounded-full border border-cyan-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-cyan-500 text-black font-bold text-xs flex items-center justify-center">
                    {userProfile.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-cyan-200">{userProfile.email}</div>
                  <div className="text-[9px] text-cyan-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected via OAuth
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await handleDisconnectGmail();
                    handleConnectGmail();
                  }}
                  className="px-2 py-1 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 rounded-lg text-[11px] font-bold border border-cyan-500/40 transition-colors cursor-pointer flex items-center gap-1 ml-1"
                  title="Switch to a different Gmail account"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Switch Account</span>
                </button>
                <button
                  onClick={handleDisconnectGmail}
                  className="p-1 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold border border-red-500/30 transition-colors cursor-pointer"
                  title="Disconnect Google Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGmail}
                disabled={isConnecting}
                className="gsi-material-button px-4 py-2 bg-white text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isConnecting ? 'Connecting OAuth...' : 'Connect / Switch Gmail'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <div className="px-5 py-2 bg-[#0c1018] border-b border-cyan-900/40 flex items-center justify-between shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setActiveTab('compose');
                soundEngine.playClick();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compose Email</span>
            </button>

            <button
              onClick={() => handleLoadMessages('inbox')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inbox'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Inbox</span>
            </button>

            <button
              onClick={() => handleLoadMessages('sent')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sent'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sent Messages</span>
            </button>
          </div>

          <button
            onClick={() => setShowAiDraftModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span>AI Draft Generator</span>
          </button>
        </div>

        {/* --- ERROR OR SUCCESS NOTIFICATIONS --- */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-3 bg-red-950/90 border border-red-500/80 rounded-xl text-xs text-red-200 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">✕</button>
          </div>
        )}

        {sendSuccessReceipt && (
          <div className="mx-5 mt-3 p-3.5 bg-emerald-950/90 border border-emerald-500/80 rounded-xl text-xs text-emerald-200 space-y-1 shrink-0 shadow-xl">
            <div className="flex items-center justify-between font-bold text-emerald-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                EMAIL DELIVERED VIA GMAIL API!
              </span>
              <span className="font-mono text-[10px] text-emerald-400">{sendSuccessReceipt.time}</span>
            </div>
            <p className="text-[11px] text-emerald-100">
              Delivered to <strong className="text-white">{sendSuccessReceipt.to.join(', ')}</strong>.
            </p>
            <div className="flex items-center gap-3 font-mono text-[10px] text-emerald-400/80 pt-1 border-t border-emerald-900/80">
              <span>Gmail Message ID: {sendSuccessReceipt.id}</span>
              <span>Thread ID: {sendSuccessReceipt.threadId}</span>
            </div>
          </div>
        )}

        {/* --- MAIN TAB CONTENT --- */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-cyan-900/40">

          {/* TAB 1: COMPOSE EMAIL */}
          {activeTab === 'compose' && (
            <div className="space-y-4">
              {!isConnected && (
                <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-cyan-200">Connect Your Gmail Account via Google OAuth</div>
                      <div className="text-[11px] text-cyan-300/70">Each user connects their own Gmail address. No passwords are stored.</div>
                    </div>
                  </div>
                  <button
                    onClick={handleConnectGmail}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer shrink-0"
                  >
                    Connect Gmail
                  </button>
                </div>
              )}

              {/* Email Form */}
              <div className="bg-[#0e121a] border border-cyan-900/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                
                {/* To Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <label>To (Recipients):</label>
                    <div className="flex items-center gap-2 text-[11px] text-cyan-400">
                      {!showCc && (
                        <button onClick={() => setShowCc(true)} className="hover:underline cursor-pointer">+ Add Cc</button>
                      )}
                      {!showBcc && (
                        <button onClick={() => setShowBcc(true)} className="hover:underline cursor-pointer">+ Add Bcc</button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 bg-[#05070a] border border-cyan-900/50 rounded-xl p-2 min-h-[42px] focus-within:border-cyan-400 transition-colors">
                    {toRecipients.map((email, idx) => (
                      <span key={idx} className="bg-cyan-950 text-cyan-300 border border-cyan-700/80 px-2.5 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1">
                        {email}
                        <button onClick={() => setToRecipients(prev => prev.filter((_, i) => i !== idx))} className="hover:text-red-400 text-xs">✕</button>
                      </span>
                    ))}
                    <input
                      type="email"
                      placeholder={toRecipients.length === 0 ? "Type recipient email and press Enter or comma..." : "Add more..."}
                      value={toInput}
                      onChange={(e) => setToInput(e.target.value)}
                      onKeyDown={handleAddToRecipient}
                      className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none min-w-[200px]"
                    />
                  </div>
                </div>

                {/* Cc Field */}
                {showCc && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-zinc-300">Cc:</label>
                    <div className="flex flex-wrap items-center gap-1.5 bg-[#05070a] border border-cyan-900/50 rounded-xl p-2 min-h-[38px] focus-within:border-cyan-400">
                      {ccRecipients.map((email, idx) => (
                        <span key={idx} className="bg-blue-950 text-blue-300 border border-blue-700/80 px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1">
                          {email}
                          <button onClick={() => setCcRecipients(prev => prev.filter((_, i) => i !== idx))} className="hover:text-red-400 text-xs">✕</button>
                        </span>
                      ))}
                      <input
                        type="email"
                        placeholder="Type Cc email and press Enter..."
                        value={ccInput}
                        onChange={(e) => setCcInput(e.target.value)}
                        onKeyDown={handleAddCcRecipient}
                        className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none min-w-[200px]"
                      />
                    </div>
                  </div>
                )}

                {/* Bcc Field */}
                {showBcc && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-zinc-300">Bcc:</label>
                    <div className="flex flex-wrap items-center gap-1.5 bg-[#05070a] border border-cyan-900/50 rounded-xl p-2 min-h-[38px] focus-within:border-cyan-400">
                      {bccRecipients.map((email, idx) => (
                        <span key={idx} className="bg-purple-950 text-purple-300 border border-purple-700/80 px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1">
                          {email}
                          <button onClick={() => setBccRecipients(prev => prev.filter((_, i) => i !== idx))} className="hover:text-red-400 text-xs">✕</button>
                        </span>
                      ))}
                      <input
                        type="email"
                        placeholder="Type Bcc email and press Enter..."
                        value={bccInput}
                        onChange={(e) => setBccInput(e.target.value)}
                        onKeyDown={handleAddBccRecipient}
                        className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none min-w-[200px]"
                      />
                    </div>
                  </div>
                )}

                {/* Subject */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <label>Subject:</label>
                    <button
                      onClick={handleAiSuggestSubject}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Suggest Subject
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter email subject line..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#05070a] border border-cyan-900/50 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <label>Message Body:</label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        onClick={async () => {
                          const polished = await aiImproveEmail({ text: bodyHtml, action: 'polish' });
                          if (typeof polished === 'string') setBodyHtml(polished);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                      >
                        ✨ Polish Grammar
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    placeholder="Write your email message body here..."
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    className="w-full bg-[#05070a] border border-cyan-900/50 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-sans leading-relaxed resize-none"
                  />
                </div>

                {/* Attachments & Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                      <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Attach Files</span>
                      <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                    </label>

                    {attachments.map((att, i) => (
                      <span key={i} className="bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-lg text-[11px] text-zinc-300 flex items-center gap-1.5">
                        <span className="truncate max-w-[120px]">{att.filename}</span>
                        <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400">✕</button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (!accessToken || !isConnected) return;
                        try {
                          await saveGmailApiDraft(accessToken, { to: toRecipients, subject, bodyHtml }, userProfile?.email || 'me');
                          writeLog('Draft saved in Gmail.', 'GMAIL');
                          soundEngine.playSuccess();
                        } catch (err: any) {
                          setErrorMessage(err?.message || 'Failed to save draft.');
                        }
                      }}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Save Draft
                    </button>

                    <button
                      onClick={handleValidateAndPreSend}
                      disabled={isSending}
                      className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSending ? 'Delivering...' : 'Send Email'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INBOX & SENT MESSAGES VIEWER */}
          {(activeTab === 'inbox' || activeTab === 'sent') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  {activeTab === 'inbox' ? 'Inbox Messages' : 'Sent Messages'}
                </h3>
                <button
                  onClick={() => handleLoadMessages(activeTab)}
                  disabled={isLoadingMessages}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {isLoadingMessages ? (
                <div className="py-12 text-center text-xs text-cyan-400 animate-pulse">
                  Loading Gmail messages...
                </div>
              ) : (activeTab === 'sent' ? sentMessages : inboxMessages).length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400 bg-[#0e121a] rounded-2xl border border-zinc-800">
                  No messages found in this folder or Gmail account not connected.
                </div>
              ) : (
                <div className="space-y-2">
                  {(activeTab === 'sent' ? sentMessages : inboxMessages).map((msg) => (
                    <div key={msg.id} className="p-3.5 bg-[#0e121a] border border-cyan-900/40 hover:border-cyan-500/60 rounded-xl space-y-1 transition-all">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span className="text-cyan-300">{msg.subject}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{msg.date}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {activeTab === 'sent' ? `To: ${msg.to}` : `From: ${msg.from}`}
                      </div>
                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed pt-1 border-t border-zinc-800/60">
                        {msg.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* --- MANDATORY USER CONFIRMATION DIALOG FOR SENDING EMAIL --- */}
        {showConfirmSendModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#0e121a] border border-cyan-500/80 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Confirm Email Delivery</h3>
                  <p className="text-xs text-cyan-300/70">Send message via Gmail API</p>
                </div>
              </div>

              <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl text-xs space-y-1.5">
                <div>From: <strong className="text-cyan-300">{userProfile?.email}</strong></div>
                <div>To: <strong className="text-white">{toRecipients.join(', ')}</strong></div>
                {ccRecipients.length > 0 && <div>Cc: <span className="text-zinc-300">{ccRecipients.join(', ')}</span></div>}
                <div>Subject: <strong className="text-white">{subject}</strong></div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Are you sure you want to send this email now? The email will be sent directly through your connected Gmail account.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setShowConfirmSendModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteRealSend}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-xl text-xs shadow-lg cursor-pointer"
                >
                  Confirm & Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- AI DRAFT GENERATOR POPUP MODAL --- */}
        {showAiDraftModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#0e121a] border border-purple-500/80 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  AI Email Draft Generator
                </h3>
                <button onClick={() => setShowAiDraftModal(false)} className="text-zinc-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">What is this email about? (Topic / Purpose)</label>
                  <input
                    type="text"
                    placeholder="e.g. Schedule a project update meeting for tomorrow..."
                    value={aiPromptTopic}
                    onChange={(e) => setAiPromptTopic(e.target.value)}
                    className="w-full bg-[#05070a] border border-purple-900/60 rounded-xl p-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Recipient Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah / Hiring Manager"
                      value={aiRecipientName}
                      onChange={(e) => setAiRecipientName(e.target.value)}
                      className="w-full bg-[#05070a] border border-purple-900/60 rounded-xl p-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Desired Tone:</label>
                    <select
                      value={aiTone}
                      onChange={(e: any) => setAiTone(e.target.value)}
                      className="w-full bg-[#05070a] border border-purple-900/60 rounded-xl p-2.5 text-zinc-100 focus:outline-none"
                    >
                      <option value="Formal">Formal</option>
                      <option value="Friendly">Friendly</option>
                      <option value="Persuasive">Persuasive</option>
                      <option value="Executive">Executive</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setShowAiDraftModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateAiDraft}
                  disabled={isGeneratingAi || !aiPromptTopic.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAi ? 'Drafting with AI...' : 'Generate Draft'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
