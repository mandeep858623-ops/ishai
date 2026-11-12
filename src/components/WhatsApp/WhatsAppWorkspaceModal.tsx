import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, Send, Paperclip, Mic, Video, Phone, Image as ImageIcon, 
  FileText, Check, CheckCheck, Smile, MoreVertical, Info, Lock,
  MessageSquare, PhoneCall, UserPlus, Archive, Settings, User, Circle,
  ChevronLeft, Menu, Plus
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../../firebaseConfig';
import { 
  collection, doc, setDoc, addDoc, updateDoc, 
  query, where, orderBy, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { UserProfile } from '../../../server/authService';
import { WhatsAppUser, Conversation, Message } from './types';
import { VoiceCallModal } from './VoiceCallModal';

interface WhatsAppWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const WhatsAppWorkspaceModal: React.FC<WhatsAppWorkspaceModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'calls' | 'settings'>('chats');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<WhatsAppUser[]>([]);
  const [showCall, setShowCall] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !auth.currentUser) return;
    const q = query(
      collection(db, 'whatsapp_conversations'),
      where('participants', 'array-contains', auth.currentUser.uid)
    );
    return onSnapshot(q, (snapshot) => {
      const convs: Conversation[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      convs.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      setConversations(convs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'whatsapp_conversations'));
  }, [isOpen]);

  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, 'whatsapp_conversations', activeConversation.id, 'messages'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `messages/${activeConversation.id}`));
  }, [activeConversation]);

  const startConversationWithUser = async (targetUser: WhatsAppUser) => {
    if (!auth.currentUser) return;
    const myUid = auth.currentUser.uid;
    const existing = conversations.find(c => c.participants.includes(myUid) && c.participants.includes(targetUser.uid));
    if (existing) {
      setActiveConversation(existing);
      setActiveTab('chats');
      return;
    }

    const newConvRef = doc(collection(db, 'whatsapp_conversations'));
    const newConvData: Conversation = {
      id: newConvRef.id,
      participants: [myUid, targetUser.uid],
      participantData: {
        [myUid]: { displayName: currentUser?.fullName || 'User' },
        [targetUser.uid]: { displayName: targetUser.displayName }
      },
      updatedAt: new Date().toISOString()
    };
    await setDoc(newConvRef, newConvData);
    setActiveConversation(newConvData);
    setActiveTab('chats');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation || !auth.currentUser) return;
    const msg = {
      conversationId: activeConversation.id,
      senderId: auth.currentUser.uid,
      senderName: currentUser?.fullName || 'User',
      text: inputText.trim(),
      timestamp: serverTimestamp(),
      type: 'text'
    };
    await addDoc(collection(db, 'whatsapp_conversations', activeConversation.id, 'messages'), msg);
    await updateDoc(doc(db, 'whatsapp_conversations', activeConversation.id), { lastMessage: inputText.trim(), updatedAt: new Date().toISOString() });
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans text-zinc-200">
      <div className="w-full h-full max-w-[1600px] bg-[#0c0c0c] rounded-2xl shadow-2xl flex border border-zinc-800 overflow-hidden">
        
        {/* Left Navigation Rail */}
        <nav className="w-20 bg-[#161616] flex flex-col items-center py-6 justify-between border-r border-zinc-800 shrink-0">
          <div className="flex flex-col items-center gap-8">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/20">S</div>
            <div className="flex flex-col gap-6 text-zinc-500">
              <button onClick={() => setActiveTab('chats')} className={activeTab === 'chats' ? 'text-emerald-400' : 'hover:text-zinc-200 transition-colors'}><MessageSquare /></button>
              <button onClick={() => setActiveTab('contacts')} className={activeTab === 'contacts' ? 'text-emerald-400' : 'hover:text-zinc-200 transition-colors'}><UserPlus /></button>
              <button onClick={() => setActiveTab('calls')} className={activeTab === 'calls' ? 'text-emerald-400' : 'hover:text-zinc-200 transition-colors'}><PhoneCall /></button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6 text-zinc-500">
            <button className="hover:text-zinc-200"><Settings /></button>
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-300 border border-zinc-700">{currentUser?.fullName?.charAt(0)}</div>
          </div>
        </nav>

        {/* Conversation Sidebar */}
        <div className="w-[380px] bg-[#161616] border-r border-zinc-800 flex flex-col shrink-0">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Messages</h2>
              <button className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"><Plus className="w-5 h-5 text-emerald-400" /></button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-3.5 text-zinc-500" />
              <input 
                placeholder="Search conversations" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0c0c0c] rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-zinc-800"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <div key={conv.id} onClick={() => setActiveConversation(conv)} className={`p-4 flex gap-4 cursor-pointer hover:bg-[#1f1f1f] transition-colors ${activeConversation?.id === conv.id ? 'bg-[#262626]' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-zinc-700 flex-shrink-0 border border-zinc-600" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-white font-semibold truncate">{Object.values(conv.participantData)[0]?.displayName}</span>
                    <span className="text-[11px] text-zinc-500 flex-shrink-0">12:30 PM</span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">{conv.lastMessage || 'No messages'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Conversation Panel */}
        <div className="flex-1 flex flex-col bg-[#0c0c0c]">
          {activeConversation ? (
            <>
              <header className="h-20 px-8 bg-[#161616] flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{Object.values(activeConversation.participantData)[0]?.displayName}</h3>
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>online</p>
                  </div>
                </div>
                <div className="flex gap-6 text-zinc-400">
                  <button onClick={() => setShowCall(true)} className="hover:text-emerald-400 transition-colors"><Phone className="w-5 h-5" /></button>
                  <button onClick={() => setShowCall(true)} className="hover:text-emerald-400 transition-colors"><Video className="w-5 h-5" /></button>
                  <button className="hover:text-zinc-200 transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </div>
              </header>
              <div className="flex-1 overflow-y-auto p-10 space-y-6">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-5 py-3 rounded-2xl max-w-lg ${m.senderId === auth.currentUser?.uid ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-[#1f1f1f] text-zinc-100 rounded-bl-sm border border-zinc-800'}`}>
                      <p className="text-sm leading-relaxed">{m.text}</p>
                      <span className={`text-[10px] block text-right mt-1.5 opacity-70 ${m.senderId === auth.currentUser?.uid ? 'text-emerald-100' : 'text-zinc-400'}`}>12:35 PM</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <footer className="p-6 bg-[#161616] border-t border-zinc-800 flex items-center gap-4">
                <button className="text-zinc-500 hover:text-zinc-200 transition-colors"><Smile className="w-6 h-6" /></button>
                <button className="text-zinc-500 hover:text-zinc-200 transition-colors"><Paperclip className="w-6 h-6" /></button>
                <form onSubmit={handleSendMessage} className="flex-1">
                  <input value={inputText} onChange={e => setInputText(e.target.value)} className="w-full bg-[#0c0c0c] rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-zinc-700" placeholder="Type a message..." />
                </form>
                <button onClick={() => handleSendMessage()} className="text-emerald-400 hover:text-emerald-300 transition-colors"><Send className="w-6 h-6" /></button>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <MessageSquare className="w-20 h-20 mx-auto mb-6 text-zinc-800" />
                <h3 className="text-xl font-semibold text-zinc-300 mb-2">Welcome to SuperAI WhatsApp</h3>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {showCall && <VoiceCallModal onClose={() => setShowCall(false)} targetUser="Contact" type="voice" />}
    </div>
  );
};
