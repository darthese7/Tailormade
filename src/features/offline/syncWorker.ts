import { QueryClient } from '@tanstack/react-query'
import { apiClient, NetworkError } from '@/lib/api/client'
import { retryQueue } from '@/features/offline/retryQueue'
import { useSyncStore } from '@/features/offline/syncStore'

let processing = false

async function replayQueue(queryClient: QueryClient) {
  if (processing || !navigator.onLine) {
    return
  }

  processing = true
  try {
    await retryQueue.process(async (item) => {
      await apiClient.request(item.path, {
        method: item.method,
        body: item.body,
        token: item.token,
      })
    })
    queryClient.invalidateQueries()
  } catch (error) {
    if (!(error instanceof NetworkError)) {
      // no-op: failed request stays in queue and will retry later.
    }
  } finally {
    processing = false
    useSyncStore.getState().refreshPendingSyncCount()
  }
}

export function initializeSyncWorker(queryClient: QueryClient): () => void {
  useSyncStore.getState().refreshPendingSyncCount()
  void replayQueue(queryClient)

  const onOnline = () => {
    void replayQueue(queryClient)
  }

  window.addEventListener('online', onOnline)
  return () => {
    window.removeEventListener('online', onOnline)
  }
}

export async function enqueueOrThrow(
  error: unknown,
  item: {
    path: string
    method: 'POST' | 'PATCH'
    body: unknown
    token?: string
  },
): Promise<void> {
  if (!(error instanceof NetworkError) && navigator.onLine) {
    throw error
  }
  retryQueue.enqueue(item)
  useSyncStore.getState().refreshPendingSyncCount()
}

