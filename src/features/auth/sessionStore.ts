import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/lib/storage/keys'
import { AuthSession } from '@/types/api'

interface AuthState {
  session: AuthSession | null
  authMode: 'login' | 'signup'
  setSession: (session: AuthSession) => void
  clearSession: () => void
  setAuthMode: (mode: 'login' | 'signup') => void
}

export const useSessionStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      authMode: 'login',
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
      setAuthMode: (authMode) => set({ authMode }),
    }),
    {
      name: STORAGE_KEYS.session,
      partialize: (state) => ({
        session: state.session,
        authMode: state.authMode,
      }),
    },
  ),
)
