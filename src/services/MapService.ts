import { db, auth } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

export interface MapPlace {
  id?: string;
  user_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  notes?: string;
  created_at: any;
}

export interface MapTrip {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  waypoints: { lat: number; lng: number; name: string }[];
  distance?: number;
  duration?: number;
  created_at: any;
}

export interface MapSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'emerald';
  default_center?: { lat: number; lng: number };
  default_zoom?: number;
  updated_at: any;
}

class MapService {
  // We will use the Google Maps JS SDK via hooks in the components
  // to avoid CORS issues and leverage promise-based APIs.

  // Firestore operations
  async savePlace(place: Omit<MapPlace, 'id' | 'created_at' | 'user_id'>) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const placeRef = doc(collection(db, `user_map_records/${auth.currentUser.uid}/saved_places`));
    const newPlace: MapPlace = {
      ...place,
      user_id: auth.currentUser.uid,
      created_at: serverTimestamp()
    };
    await setDoc(placeRef, newPlace);
    return { id: placeRef.id, ...newPlace };
  }

  async getSavedPlaces(): Promise<MapPlace[]> {
    if (!auth.currentUser) return [];
    const q = query(
      collection(db, `user_map_records/${auth.currentUser.uid}/saved_places`),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MapPlace));
  }

  async deletePlace(placeId: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    await deleteDoc(doc(db, `user_map_records/${auth.currentUser.uid}/saved_places`, placeId));
  }

  async saveTrip(trip: Omit<MapTrip, 'id' | 'created_at' | 'user_id'>) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const tripRef = doc(collection(db, `user_map_records/${auth.currentUser.uid}/trips`));
    const newTrip: MapTrip = {
      ...trip,
      user_id: auth.currentUser.uid,
      created_at: serverTimestamp()
    };
    await setDoc(tripRef, newTrip);
    return { id: tripRef.id, ...newTrip };
  }

  async getTrips(): Promise<MapTrip[]> {
    if (!auth.currentUser) return [];
    const q = query(
      collection(db, `user_map_records/${auth.currentUser.uid}/trips`),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MapTrip));
  }

  async getSettings(): Promise<MapSettings | null> {
    if (!auth.currentUser) return null;
    const docRef = doc(db, 'user_map_settings', auth.currentUser.uid);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() as MapSettings : null;
  }

  async saveSettings(settings: Partial<MapSettings>) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const docRef = doc(db, 'user_map_settings', auth.currentUser.uid);
    await setDoc(docRef, {
      ...settings,
      user_id: auth.currentUser.uid,
      updated_at: serverTimestamp()
    }, { merge: true });
  }
}

export const mapService = new MapService();
