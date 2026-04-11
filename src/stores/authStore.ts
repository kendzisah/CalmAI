import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  email: string | null;
  isAnonymous: boolean;
  isAuthenticated: boolean;

  setUser: (userId: string, email: string | null, isAnonymous: boolean) => void;
  setAnonymous: (userId: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  email: null,
  isAnonymous: false,
  isAuthenticated: false,

  setUser: (userId, email, isAnonymous) =>
    set({ userId, email, isAnonymous, isAuthenticated: true }),

  setAnonymous: (userId) =>
    set({ userId, email: null, isAnonymous: true, isAuthenticated: true }),

  signOut: () =>
    set({ userId: null, email: null, isAnonymous: false, isAuthenticated: false }),
}));
