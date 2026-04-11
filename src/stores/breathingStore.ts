import { create } from 'zustand';
import { getDatabase, generateId } from '@/lib/database';
import type { BreathingPhase, BreathingTechnique } from '@/types/breathing';

interface BreathingState {
  phase: BreathingPhase;
  countdown: number;
  cycle: number;
  totalCycles: number;
  isPaused: boolean;
  isActive: boolean;
  isComplete: boolean;
  technique: BreathingTechnique;

  start: (cycles?: number, technique?: BreathingTechnique) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setPhase: (phase: BreathingPhase) => void;
  setCountdown: (n: number) => void;
  setCycle: (n: number) => void;
  complete: () => Promise<void>;
}

export const useBreathingStore = create<BreathingState>((set, get) => ({
  phase: 'inhale',
  countdown: 4,
  cycle: 1,
  totalCycles: 4,
  isPaused: false,
  isActive: false,
  isComplete: false,
  technique: 'box',

  start: (cycles = 4, technique = 'box') => {
    set({
      phase: 'inhale',
      countdown: 4,
      cycle: 1,
      totalCycles: cycles,
      isPaused: false,
      isActive: true,
      isComplete: false,
      technique,
    });
  },

  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),

  reset: () => {
    set({
      phase: 'inhale',
      countdown: 4,
      cycle: 1,
      isPaused: false,
      isActive: false,
      isComplete: false,
    });
  },

  setPhase: (phase) => set({ phase }),
  setCountdown: (n) => set({ countdown: n }),
  setCycle: (n) => set({ cycle: n }),

  complete: async () => {
    const { technique, cycle, totalCycles } = get();
    const db = await getDatabase();
    const id = generateId();
    const durationSeconds = cycle * 16; // 4 phases * 4 seconds each

    await db.runAsync(
      'INSERT INTO breathing_sessions (id, technique, duration_seconds, cycles_completed, completed, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id, technique, durationSeconds, cycle, 1, new Date().toISOString()
    );

    set({ isComplete: true, isActive: false });
  },
}));
