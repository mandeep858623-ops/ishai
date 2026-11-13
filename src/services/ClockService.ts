import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export interface ClockSettings {
  theme: 'light' | 'dark' | 'system';
  clock_style: 'minimal' | 'digital' | 'analog' | 'neon' | 'elegant';
  format_24h: boolean;
  timezone?: string;
  world_clocks?: any[];
  alarms?: any[];
  routines?: any[];
  updated_at: string;
}

export interface CalendarEvent {
  id?: string;
  user_id: string;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  category?: string;
  description?: string;
  location?: string;
  recurrence?: string;
  created_at: string;
}

export interface PlannerTask {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  completed: boolean;
  estimate?: string;
  created_at: string;
}

export interface JournalNote {
  id?: string;
  user_id: string;
  date: string;
  content: string;
  reflection?: string;
  updated_at: string;
}

export interface Habit {
  id?: string;
  user_id: string;
  name: string;
  category: string;
  schedule: 'daily' | 'weekly' | 'custom';
  custom_days?: number[];
  target: number;
  reminder_time?: string;
  completed_dates: string[];
  created_at: string;
  archived: boolean;
}

export interface Countdown {
  id?: string;
  user_id: string;
  title: string;
  target_date: string;
  category: string;
  color: string;
  reminder_enabled: boolean;
  is_recurring_annual: boolean;
  created_at: string;
}

export interface TimeRecord {
  id?: string;
  user_id: string;
  category: string;
  duration: number;
  type: 'focus' | 'break' | 'task';
  task_id?: string;
  start_time: string;
  end_time: string;
}

export interface LifeMilestone {
  id?: string;
  user_id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  image_url?: string;
  created_at: string;
}

export class ClockService {
  private static SETTINGS_COLLECTION = 'user_clock_settings';
  private static RECORDS_COLLECTION = 'user_clock_records';

  private static canAccess(userId: string): boolean {
    return Boolean(userId && auth.currentUser && auth.currentUser.uid === userId);
  }

  // --- Settings ---
  static async getSettings(userId: string): Promise<ClockSettings | null> {
    if (!this.canAccess(userId)) return null;
    try {
      const docRef = doc(db, this.SETTINGS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as ClockSettings;
      }
    } catch (err) {
      console.warn('[ClockService] getSettings skipped:', err);
    }
    return null;
  }

  static async updateSettings(userId: string, settings: Partial<ClockSettings>): Promise<void> {
    if (!this.canAccess(userId)) return;
    try {
      const docRef = doc(db, this.SETTINGS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { ...settings, updated_at: new Date().toISOString() });
      } else {
        await setDoc(docRef, {
          theme: 'dark',
          clock_style: 'digital',
          format_24h: false,
          ...settings,
          user_id: userId,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('[ClockService] updateSettings skipped:', err);
    }
  }

  // --- Events ---
  static subscribeEvents(userId: string, callback: (events: CalendarEvent[]) => void) {
    if (!this.canAccess(userId)) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'calendar_events');
    const q = query(colRef, orderBy('date', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const events = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarEvent));
        callback(events);
      },
      (err) => console.warn('[ClockService] subscribeEvents notice:', err)
    );
  }

  static async addEvent(userId: string, event: Omit<CalendarEvent, 'user_id' | 'created_at'>) {
    if (!this.canAccess(userId)) return null;
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'calendar_events');
    return await addDoc(colRef, {
      ...event,
      user_id: userId,
      created_at: new Date().toISOString()
    });
  }

  static async updateEvent(userId: string, eventId: string, event: Partial<CalendarEvent>) {
    if (!this.canAccess(userId)) return;
    const docRef = doc(db, this.RECORDS_COLLECTION, userId, 'calendar_events', eventId);
    await updateDoc(docRef, event);
  }

  static async deleteEvent(userId: string, eventId: string) {
    if (!this.canAccess(userId)) return;
    const docRef = doc(db, this.RECORDS_COLLECTION, userId, 'calendar_events', eventId);
    await deleteDoc(docRef);
  }

  // --- Tasks ---
  static subscribeTasks(userId: string, callback: (tasks: PlannerTask[]) => void) {
    if (!this.canAccess(userId)) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'planner_tasks');
    const q = query(colRef, orderBy('created_at', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PlannerTask));
        callback(tasks);
      },
      (err) => console.warn('[ClockService] subscribeTasks notice:', err)
    );
  }

  static async addTask(userId: string, task: Omit<PlannerTask, 'user_id' | 'created_at'>) {
    if (!this.canAccess(userId)) return null;
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'planner_tasks');
    return await addDoc(colRef, {
      ...task,
      user_id: userId,
      created_at: new Date().toISOString()
    });
  }

  static async updateTask(userId: string, taskId: string, task: Partial<PlannerTask>) {
    if (!this.canAccess(userId)) return;
    const docRef = doc(db, this.RECORDS_COLLECTION, userId, 'planner_tasks', taskId);
    await updateDoc(docRef, task);
  }

  static async deleteTask(userId: string, taskId: string) {
    if (!this.canAccess(userId)) return;
    const docRef = doc(db, this.RECORDS_COLLECTION, userId, 'planner_tasks', taskId);
    await deleteDoc(docRef);
  }

  // --- Habits ---
  static subscribeHabits(userId: string, callback: (habits: Habit[]) => void) {
    if (!this.canAccess(userId)) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'habits');
    const q = query(colRef, orderBy('created_at', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const habits = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Habit));
        callback(habits);
      },
      (err) => console.warn('[ClockService] subscribeHabits notice:', err)
    );
  }

  static async addHabit(userId: string, habit: Omit<Habit, 'user_id' | 'created_at' | 'completed_dates' | 'archived'>) {
    if (!this.canAccess(userId)) return null;
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'habits');
    return await addDoc(colRef, {
      ...habit,
      user_id: userId,
      completed_dates: [],
      archived: false,
      created_at: new Date().toISOString()
    });
  }

  static async updateHabit(userId: string, habitId: string, habit: Partial<Habit>) {
    if (!this.canAccess(userId)) return;
    const docRef = doc(db, this.RECORDS_COLLECTION, userId, 'habits', habitId);
    await updateDoc(docRef, habit);
  }

  static async deleteHabit(userId: string, habitId: string) {
    if (!this.canAccess(userId)) return;
    const docRef = doc(db, this.RECORDS_COLLECTION, userId, 'habits', habitId);
    await deleteDoc(docRef);
  }

  // --- Countdowns ---
  static subscribeCountdowns(userId: string, callback: (countdowns: Countdown[]) => void) {
    if (!this.canAccess(userId)) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'countdowns');
    const q = query(colRef, orderBy('target_date', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const countdowns = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Countdown));
        callback(countdowns);
      },
      (err) => console.warn('[ClockService] subscribeCountdowns notice:', err)
    );
  }

  static async addCountdown(userId: string, countdown: Omit<Countdown, 'user_id' | 'created_at'>) {
    if (!this.canAccess(userId)) return null;
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'countdowns');
    return await addDoc(colRef, {
      ...countdown,
      user_id: userId,
      created_at: new Date().toISOString()
    });
  }

  static async updateCountdown(userId: string, countdownId: string, countdown: Partial<Countdown>) {
    if (!this.canAccess(userId)) return;
    const docRef = doc(db, this.RECORDS_COLLECTION, userId, 'countdowns', countdownId);
    await updateDoc(docRef, countdown);
  }

  static async deleteCountdown(userId: string, countdownId: string) {
    if (!this.canAccess(userId)) return;
    const docRef = doc(db, this.RECORDS_COLLECTION, userId, 'countdowns', countdownId);
    await deleteDoc(docRef);
  }

  // --- Time Records (Analytics) ---
  static subscribeTimeRecords(userId: string, callback: (records: TimeRecord[]) => void) {
    if (!this.canAccess(userId)) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'time_records');
    const q = query(colRef, orderBy('start_time', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TimeRecord));
        callback(records);
      },
      (err) => console.warn('[ClockService] subscribeTimeRecords notice:', err)
    );
  }

  static async addTimeRecord(userId: string, record: Omit<TimeRecord, 'user_id'>) {
    if (!this.canAccess(userId)) return null;
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'time_records');
    return await addDoc(colRef, {
      ...record,
      user_id: userId
    });
  }

  // --- Life Milestones ---
  static subscribeMilestones(userId: string, callback: (milestones: LifeMilestone[]) => void) {
    if (!this.canAccess(userId)) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'life_milestones');
    const q = query(colRef, orderBy('date', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const milestones = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as LifeMilestone));
        callback(milestones);
      },
      (err) => console.warn('[ClockService] subscribeMilestones notice:', err)
    );
  }

  static async addMilestone(userId: string, milestone: Omit<LifeMilestone, 'user_id' | 'created_at'>) {
    if (!this.canAccess(userId)) return null;
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'life_milestones');
    return await addDoc(colRef, {
      ...milestone,
      user_id: userId,
      created_at: new Date().toISOString()
    });
  }

  static async deleteMilestone(userId: string, milestoneId: string) {
    if (!this.canAccess(userId)) return;
    const docRef = doc(db, this.RECORDS_COLLECTION, userId, 'life_milestones', milestoneId);
    await deleteDoc(docRef);
  }

  // --- Notes ---
  static subscribeNotes(userId: string, callback: (notes: JournalNote[]) => void) {
    if (!this.canAccess(userId)) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, this.RECORDS_COLLECTION, userId, 'journal_notes');
    const q = query(colRef, orderBy('date', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const notes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JournalNote));
        callback(notes);
      },
      (err) => console.warn('[ClockService] subscribeNotes notice:', err)
    );
  }

  static async saveNote(userId: string, note: Omit<JournalNote, 'user_id' | 'updated_at'>) {
    if (!this.canAccess(userId)) return;
    const noteId = `${userId}_${note.date}`;
    const docRef = doc(db, this.RECORDS_COLLECTION, userId, 'journal_notes', noteId);
    await setDoc(docRef, {
      ...note,
      user_id: userId,
      updated_at: new Date().toISOString()
    }, { merge: true });
  }

  static async deleteNote(userId: string, noteId: string) {
    if (!this.canAccess(userId)) return;
    const docRef = doc(db, this.RECORDS_COLLECTION, userId, 'journal_notes', noteId);
    await deleteDoc(docRef);
  }
}
