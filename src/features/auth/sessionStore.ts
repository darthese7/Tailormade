import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/lib/storage/keys'
import { AuthSession } from '@/types/api'

interface AuthState {
  session: AuthSession | null
  pendingSession: AuthSession | null
  otpPhone: string
  authMode: 'login' | 'signup'
  setSession: (session: AuthSession) => void
  setPendingSession: (session: AuthSession | null) => void
  clearPendingSession: () => void
  clearSession: () => void
  setOtpPhone: (phone: string) => void
  setAuthMode: (mode: 'login' | 'signup') => void
}

export const useSessionStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      pendingSession: null,
      otpPhone: '',
      authMode: 'login',
      setSession: (session) => set({ session, pendingSession: null }),
      setPendingSession: (pendingSession) => set({ pendingSession }),
      clearPendingSession: () => set({ pendingSession: null }),
      clearSession: () => set({ session: null, pendingSession: null }),
      setOtpPhone: (otpPhone) => set({ otpPhone }),
      setAuthMode: (authMode) => set({ authMode }),
    }),
    {
      name: STORAGE_KEYS.session,
      partialize: (state) => ({
        session: state.session,
        pendingSession: state.pendingSession,
        otpPhone: state.otpPhone,
        authMode: state.authMode,
      }),
    },
  ),
)
