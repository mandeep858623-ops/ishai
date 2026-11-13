import { db, storage, auth, handleFirestoreError, OperationType } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { MemoryItem } from '../../server/memoryVaultService';

export interface CameraPhoto {
  id?: string;
  userId: string;
  name: string;
  url: string;
  createdAt: string;
  size?: number;
  type?: string;
  width?: number;
  height?: number;
  filters?: {
    brightness?: number;
    contrast?: number;
    grayscale?: boolean;
    sepia?: boolean;
    hueRotate?: number;
  };
}

const COLLECTION_NAME = 'camera_photos';
const VAULT_COLLECTION = 'user_vault_records';
const VAULT_STORAGE_PREFIX = 'SUPERAI_AI_Memory_Vault_v1';
const CAMERA_PHOTOS_PREFIX = 'SUPERAI_Camera_Photos';

/**
 * Converts a Blob to a base64 DataURL
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a base64 DataURL to a Blob
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].replace('data:', '') || 'image/jpeg';
  const byteCharacters = atob(parts[1] || parts[0]);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: contentType });
}

export const CameraService = {
  /**
   * Uploads and persistently saves a captured photo directly to storage, database, and AI Vault.
   * Seamlessly falls back through Cloud Storage -> Server Uploads -> Local Vault so photo is never lost.
   */
  async uploadPhoto(
    fileOrBlob: Blob | string,
    name: string,
    metadata: Partial<CameraPhoto> = {},
    syncToVault: boolean = true,
    customUserId?: string
  ): Promise<CameraPhoto> {
    const userId = customUserId || auth.currentUser?.uid || 'guest_default';
    const timestamp = Date.now();
    const sanitizedName = name.replace(/[^a-zA-Z0-9._-]/g, '_') || `capture_${timestamp}.jpg`;
    const photoId = `photo_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    let blobFile: Blob;
    let base64Data: string;

    if (typeof fileOrBlob === 'string') {
      base64Data = fileOrBlob;
      blobFile = base64ToBlob(fileOrBlob);
    } else {
      blobFile = fileOrBlob;
      base64Data = await blobToBase64(fileOrBlob);
    }

    let resolvedUrl: string = base64Data;
    let storageType = 'local_data';

    // 1. Try Firebase Cloud Storage if authenticated
    if (auth.currentUser && storage) {
      try {
        const fileName = `${userId}_${timestamp}_${sanitizedName}`;
        const storageRef = ref(storage, `camera/${userId}/${fileName}`);
        await uploadBytes(storageRef, blobFile);
        resolvedUrl = await getDownloadURL(storageRef);
        storageType = 'firebase_storage';
      } catch (storageErr) {
        console.warn('[CameraService] Cloud storage upload skipped/failed, trying backend server storage:', storageErr);
      }
    }

    // 2. If Cloud Storage was not used or failed, try backend server storage
    if (storageType === 'local_data') {
      try {
        const res = await fetch('/api/vault/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerUid: userId,
            fileName: sanitizedName,
            base64: base64Data,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.url) {
          resolvedUrl = data.url;
          storageType = 'server_uploads';
        }
      } catch (serverErr) {
        console.warn('[CameraService] Server storage write skipped/failed, using persistent DataURL:', serverErr);
      }
    }

    const photoData: CameraPhoto = {
      id: photoId,
      userId,
      name: sanitizedName,
      url: resolvedUrl,
      createdAt: new Date().toISOString(),
      size: blobFile.size,
      type: blobFile.type || 'image/jpeg',
      filters: metadata.filters || {},
      ...metadata,
    };

    // 3. Save to Firestore camera_photos collection if permitted
    if (auth.currentUser && auth.currentUser.uid === userId && resolvedUrl.length <= 2000) {
      try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          id: photoId,
          userId,
          name: sanitizedName,
          url: resolvedUrl,
          createdAt: photoData.createdAt,
          size: photoData.size || blobFile.size,
          type: photoData.type || blobFile.type || 'image/jpeg',
          filters: photoData.filters || {},
        });
        photoData.id = docRef.id;
      } catch (fsErr) {
        console.warn('[CameraService] Firestore camera_photos collection write failed (non-critical):', fsErr);
      }
    }

    // 4. Save to user-scoped LocalStorage camera cache
    try {
      const localKey = `${CAMERA_PHOTOS_PREFIX}_${userId}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updated = [photoData, ...existing.filter((p: any) => p.id !== photoData.id && p.url !== photoData.url)];
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (localErr) {
      console.warn('[CameraService] Failed to cache photo in localStorage:', localErr);
    }

    // 5. Automatically Save to AI Vault -> Photos section
    if (syncToVault) {
      try {
        await CameraService.saveToVault(photoData, userId);
      } catch (vaultErr) {
        console.warn('[CameraService] Vault sync encountered error:', vaultErr);
      }
    }

    return photoData;
  },

  /**
   * Retrieves all photos for the user across Server Disk, Firestore, AI Vault, and LocalStorage
   */
  async getPhotos(customUserId?: string): Promise<CameraPhoto[]> {
    const userId = customUserId || auth.currentUser?.uid || 'guest_default';
    const photosMap = new Map<string, CameraPhoto>();

    // 1. Read from LocalStorage camera cache for current user
    try {
      const localKey = `${CAMERA_PHOTOS_PREFIX}_${userId}`;
      const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
      if (Array.isArray(cached)) {
        cached.forEach((p: CameraPhoto) => {
          if (p.id || p.url) photosMap.set(p.id || p.url, p);
        });
      }
    } catch (e) {
      console.warn('[CameraService] Failed to read cached photos:', e);
    }

    // If user is authenticated, also check if any photos were stored under guest_default and adopt them
    if (userId !== 'guest_default') {
      try {
        const guestKey = `${CAMERA_PHOTOS_PREFIX}_guest_default`;
        const guestCached = JSON.parse(localStorage.getItem(guestKey) || '[]');
        if (Array.isArray(guestCached) && guestCached.length > 0) {
          guestCached.forEach((p: CameraPhoto) => {
            const adopted = { ...p, userId };
            const key = p.id || p.url;
            if (!photosMap.has(key)) photosMap.set(key, adopted);
          });
        }
      } catch {}
    }

    // 2. Read from AI Vault LocalStorage memories
    try {
      const vaultKey = `${VAULT_STORAGE_PREFIX}_${userId}`;
      const vaultMemories = JSON.parse(localStorage.getItem(vaultKey) || '[]');
      if (Array.isArray(vaultMemories)) {
        vaultMemories
          .filter((m: any) => !m.isTrashed && (m.type === 'photo' || m.collection?.toLowerCase() === 'photos'))
          .forEach((m: any) => {
            const id = m.id.replace(/^photo_/, '');
            const key = id || m.id || m.sourceReference;
            if (!photosMap.has(key) && !photosMap.has(id) && !photosMap.has(m.id)) {
              photosMap.set(key, {
                id,
                userId,
                name: m.title.replace(/^Captured Photo:\s*/, ''),
                url: m.sourceReference || '',
                createdAt: m.createdAt,
                filters: m.filters || {},
              });
            }
          });
      }
    } catch (e) {
      console.warn('[CameraService] Failed to load photos from local vault:', e);
    }

    // 3. Query Server Disk Storage (/api/vault/photos/:ownerUid)
    try {
      const res = await fetch(`/api/vault/photos/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.photos)) {
          data.photos.forEach((p: CameraPhoto) => {
            const key = p.url || p.id;
            if (key) {
              const existing = photosMap.get(key) || photosMap.get(p.id!);
              photosMap.set(key, {
                ...p,
                name: existing?.name || p.name,
                filters: existing?.filters || {},
              });
            }
          });
        }
      }
    } catch (serverErr) {
      console.warn('[CameraService] Server photos fetch skipped/failed:', serverErr);
    }

    // 4. Read from Firestore user_vault_records
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        const vaultDocRef = doc(db, VAULT_COLLECTION, userId);
        const snap = await getDoc(vaultDocRef);
        if (snap.exists()) {
          const remoteMemories = snap.data().memories || [];
          remoteMemories
            .filter((m: any) => !m.isTrashed && (m.type === 'photo' || m.collection?.toLowerCase() === 'photos'))
            .forEach((m: any) => {
              const id = m.id.replace(/^photo_/, '');
              const key = id || m.id || m.sourceReference;
              if (key && !photosMap.has(key)) {
                photosMap.set(key, {
                  id,
                  userId,
                  name: m.title.replace(/^Captured Photo:\s*/, ''),
                  url: m.sourceReference || '',
                  createdAt: m.createdAt,
                  filters: m.filters || {},
                });
              }
            });
        }
      } catch (fsVaultErr) {
        console.warn('[CameraService] Firestore user_vault_records read error:', fsVaultErr);
      }
    }

    // 5. Read from Firestore camera_photos collection if user is authenticated
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        const q = query(
          collection(db, COLLECTION_NAME),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        snapshot.docs.forEach((d) => {
          const data = d.data();
          const pId = data.id || d.id;
          const key = pId || data.url;
          if (key) {
            photosMap.set(key, { id: pId, ...data } as CameraPhoto);
          }
        });
      } catch (error) {
        console.warn('[CameraService] Firestore list camera_photos failed (using merged sources):', error);
      }
    }

    const unifiedMap = new Map<string, CameraPhoto>();
    Array.from(photosMap.values()).forEach((photo) => {
      const rawId = photo.id || (photo.url ? `photo_${photo.url.replace(/[^a-zA-Z0-9_-]/g, '_')}` : `photo_${Date.now()}`);
      const cleanId = rawId.replace(/^(photo_)+/, 'photo_');
      const dedupeKey = photo.url || cleanId;
      if (!unifiedMap.has(dedupeKey)) {
        unifiedMap.set(dedupeKey, { ...photo, id: cleanId });
      }
    });

    const list = Array.from(unifiedMap.values());
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Update local storage cache with unified records
    try {
      const localKey = `${CAMERA_PHOTOS_PREFIX}_${userId}`;
      localStorage.setItem(localKey, JSON.stringify(list));
    } catch {}

    return list;
  },

  /**
   * Deletes a photo permanently from Server Disk, Firestore, Storage, and AI Vault
   */
  async deletePhoto(photo: CameraPhoto, customUserId?: string): Promise<void> {
    const userId = customUserId || photo.userId || auth.currentUser?.uid || 'guest_default';

    // 1. Delete from Server Disk Storage if hosted at /uploads/...
    if (photo.url && photo.url.startsWith('/uploads/')) {
      try {
        await fetch('/api/vault/photo', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerUid: userId,
            url: photo.url,
            fileName: photo.name,
          }),
        });
      } catch (srvDelErr) {
        console.warn('[CameraService] Server disk photo deletion warning:', srvDelErr);
      }
    }

    // 2. Delete from Firestore camera_photos
    if (photo.id && auth.currentUser && auth.currentUser.uid === userId) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, photo.id));
      } catch (fsErr) {
        console.warn('[CameraService] Firestore photo delete failed:', fsErr);
      }
    }

    // 3. Delete from LocalStorage camera cache
    try {
      const localKey = `${CAMERA_PHOTOS_PREFIX}_${userId}`;
      const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
      const filtered = cached.filter((p: any) => p.id !== photo.id && p.url !== photo.url);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    } catch {}

    // 4. Remove from AI Vault (Firestore & LocalStorage)
    const memoryId = `photo_${photo.id}`;
    const altMemoryId = photo.id;

    // Local Vault
    const vaultKey = `${VAULT_STORAGE_PREFIX}_${userId}`;
    let vaultMemories: MemoryItem[] = [];
    try {
      vaultMemories = JSON.parse(localStorage.getItem(vaultKey) || '[]');
      const updatedVault = vaultMemories.filter((m: any) => m.id !== memoryId && m.id !== altMemoryId && m.sourceReference !== photo.url);
      localStorage.setItem(vaultKey, JSON.stringify(updatedVault));
      vaultMemories = updatedVault;
    } catch {}

    // Firestore Vault
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        const vaultDocRef = doc(db, VAULT_COLLECTION, userId);
        const snap = await getDoc(vaultDocRef);
        if (snap.exists()) {
          const remoteMemories = snap.data().memories || [];
          const updated = remoteMemories.filter((m: any) => m.id !== memoryId && m.id !== altMemoryId && m.sourceReference !== photo.url);
          await setDoc(vaultDocRef, { user_id: userId, memories: updated, updated_at: new Date().toISOString() }, { merge: true });
        }
      } catch (vErr) {
        console.warn('[CameraService] Firestore vault sync deletion failed:', vErr);
      }
    }

    // 5. Delete from Storage if it's a Firebase Storage URL
    if (photo.url && photo.url.includes('firebasestorage')) {
      try {
        const storageRef = ref(storage, photo.url);
        await deleteObject(storageRef);
      } catch (storageErr) {
        console.warn('[CameraService] Storage binary deletion error:', storageErr);
      }
    }

    // Dispatch global event for instant UI sync across all open modals
    window.dispatchEvent(
      new CustomEvent('vault_updated', {
        detail: {
          deletedPhotoId: photo.id,
          deletedUrl: photo.url,
          userId,
        },
      })
    );
  },

  /**
   * Renames a photo across camera and vault
   */
  async renamePhoto(id: string, newName: string, customUserId?: string): Promise<void> {
    const userId = customUserId || auth.currentUser?.uid || 'guest_default';

    // 1. Update Firestore camera_photos
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { name: newName });
      } catch (e) {
        console.warn('[CameraService] Rename in camera_photos failed:', e);
      }
    }

    // 2. Update LocalStorage camera cache
    try {
      const localKey = `${CAMERA_PHOTOS_PREFIX}_${userId}`;
      const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updated = cached.map((p: any) => p.id === id ? { ...p, name: newName } : p);
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch {}

    // 3. Update AI Vault memory
    const memoryId = `photo_${id}`;
    const vaultKey = `${VAULT_STORAGE_PREFIX}_${userId}`;
    try {
      const vaultMemories = JSON.parse(localStorage.getItem(vaultKey) || '[]');
      const updatedVault = vaultMemories.map((m: any) => {
        if (m.id === memoryId || m.id === id) {
          return { ...m, title: `Captured Photo: ${newName}`, updatedAt: new Date().toISOString() };
        }
        return m;
      });
      localStorage.setItem(vaultKey, JSON.stringify(updatedVault));

      if (auth.currentUser && auth.currentUser.uid === userId) {
        const vaultDocRef = doc(db, VAULT_COLLECTION, userId);
        const snap = await getDoc(vaultDocRef);
        if (snap.exists()) {
          const remoteMemories = snap.data().memories || [];
          const updated = remoteMemories.map((m: any) => {
            if (m.id === memoryId || m.id === id) {
              return { ...m, title: `Captured Photo: ${newName}`, updatedAt: new Date().toISOString() };
            }
            return m;
          });
          await setDoc(vaultDocRef, { user_id: userId, memories: updated, updated_at: new Date().toISOString() }, { merge: true });
        }
      }
    } catch (e) {
      console.warn('[CameraService] Vault rename sync failed:', e);
    }

    window.dispatchEvent(new CustomEvent('vault_updated', { detail: { renamedPhotoId: id, newName } }));
  },

  /**
   * Updates photo metadata/filters
   */
  async updatePhoto(id: string, updates: Partial<CameraPhoto>, customUserId?: string): Promise<void> {
    const userId = customUserId || auth.currentUser?.uid || 'guest_default';

    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, updates);
      } catch {}
    }

    try {
      const localKey = `${CAMERA_PHOTOS_PREFIX}_${userId}`;
      const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updated = cached.map((p: any) => p.id === id ? { ...p, ...updates } : p);
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch {}
  },

  /**
   * DIRECTLY COMMITS A PHOTO RECORD TO AI VAULT -> PHOTOS
   */
  async saveToVault(photo: CameraPhoto, customUserId?: string): Promise<MemoryItem> {
    const userId = customUserId || photo.userId || auth.currentUser?.uid || 'guest_default';
    const rawPhotoId = photo.id || Date.now().toString();
    const cleanPhotoId = rawPhotoId.replace(/^(photo_)+/, '');
    const memoryId = `photo_${cleanPhotoId}`;
    const now = new Date().toISOString();

    const newMemory: MemoryItem = {
      id: memoryId,
      title: `Captured Photo: ${photo.name}`,
      content: `Photo captured via SuperAI Camera.\nSource Reference: ${photo.url}\nResolution: ${photo.width || 'N/A'}x${photo.height || 'N/A'}\nSize: ${(photo.size ? (photo.size / 1024).toFixed(1) : 'N/A')} KB`,
      type: 'photo',
      tags: ['camera', 'photo', 'captured', 'photos'],
      collection: 'photos', // Canonical AI Vault -> Photos collection
      createdAt: photo.createdAt || now,
      updatedAt: now,
      isPinned: false,
      isTrashed: false,
      sourceReference: photo.url,
    };

    // 1. Immediately update LocalStorage Vault
    const vaultKey = `${VAULT_STORAGE_PREFIX}_${userId}`;
    let localMemories: MemoryItem[] = [];
    try {
      localMemories = JSON.parse(localStorage.getItem(vaultKey) || '[]');
      const idx = localMemories.findIndex((m: any) => m.id === memoryId || m.sourceReference === photo.url);
      if (idx >= 0) {
        localMemories[idx] = { ...localMemories[idx], ...newMemory, createdAt: localMemories[idx].createdAt };
      } else {
        localMemories = [newMemory, ...localMemories];
      }
      localStorage.setItem(vaultKey, JSON.stringify(localMemories));
    } catch (e) {
      console.warn('[CameraService] LocalStorage vault update error:', e);
    }

    // 2. Persist to Firestore user_vault_records
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        const docRef = doc(db, VAULT_COLLECTION, userId);
        const snap = await getDoc(docRef);
        let memories: MemoryItem[] = snap.exists() ? snap.data().memories || [] : [];
        const existingIdx = memories.findIndex((m: any) => m.id === memoryId || m.sourceReference === photo.url);
        if (existingIdx >= 0) {
          memories[existingIdx] = { ...memories[existingIdx], ...newMemory, createdAt: memories[existingIdx].createdAt };
        } else {
          memories = [newMemory, ...memories];
        }

        await setDoc(docRef, {
          user_id: userId,
          memories,
          updated_at: now,
        }, { merge: true });
        console.log(`[CameraService] Successfully committed photo to Firestore AI Vault for user ${userId}.`);
      } catch (err) {
        console.warn('[CameraService] Firestore user_vault_records write error (cached locally):', err);
      }
    }

    // 3. Notify all listeners (AIMemoryVaultModal) to render instantly without refreshing
    window.dispatchEvent(
      new CustomEvent('vault_updated', {
        detail: {
          memory: newMemory,
          photo,
          userId,
        },
      })
    );

    return newMemory;
  },
};
