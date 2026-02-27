import { create } from 'zustand'
import { retryQueue } from '@/features/offline/retryQueue'

interface SyncState {
  pendingSyncCount: number
  setPendingSyncCount: (count: number) => void
  refreshPendingSyncCount: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  pendingSyncCount: retryQueue.length(),
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
  refreshPendingSyncCount: () => set({ pendingSyncCount: retryQueue.length() }),
}))

