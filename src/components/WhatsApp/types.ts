export interface WhatsAppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  statusText?: string;
  lastSeen?: string;
  isOnline?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[]; // [uid1, uid2]
  participantData: {
    [uid: string]: {
      displayName: string;
      photoURL?: string;
      email?: string;
    }
  };
  lastMessage?: string;
  lastMessageTimestamp?: any;
  unreadCount?: {
    [uid: string]: number;
  };
  updatedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  mediaUrl?: string;
  fileName?: string;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  reactions?: {
    [emoji: string]: string[]; // uid list
  };
  isDeleted?: boolean;
  isEdited?: boolean;
  readBy?: string[];
}

export interface CallRecord {
  id: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'ended' | 'missed' | 'declined';
  timestamp: any;
}

export interface CallSession {
  id: string;
  callerId: string;
  receiverId: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'ended';
  offer?: any; // RTCSessionDescriptionInit
  answer?: any; // RTCSessionDescriptionInit
  callerCandidates?: any[]; // RTCIceCandidate[]
  receiverCandidates?: any[]; // RTCIceCandidate[]
  updatedAt: any;
}
