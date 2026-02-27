import { KeyValueStorage, getJsonFromStorage, setJsonToStorage } from '@/lib/storage/localStorage'
import { STORAGE_KEYS } from '@/lib/storage/keys'

export type RetryMethod = 'POST' | 'PATCH'

export interface RetryQueueItem {
  id: string
  path: string
  method: RetryMethod
  body: unknown
  token?: string
  createdAt: string
}

export interface RetryQueue {
  list: () => RetryQueueItem[]
  length: () => number
  enqueue: (item: Omit<RetryQueueItem, 'id' | 'createdAt'>) => RetryQueueItem
  process: (
    processor: (item: RetryQueueItem) => Promise<void>,
  ) => Promise<{ processed: number; failed: number }>
  clear: () => void
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createRetryQueue(storage: KeyValueStorage): RetryQueue {
  const read = () => getJsonFromStorage<RetryQueueItem[]>(storage, STORAGE_KEYS.retryQueue, [])
  const write = (queue: RetryQueueItem[]) => setJsonToStorage(storage, STORAGE_KEYS.retryQueue, queue)

  return {
    list: read,
    length: () => read().length,
    enqueue: (input) => {
      const queue = read()
      const item: RetryQueueItem = {
        ...input,
        id: createId(),
        createdAt: new Date().toISOString(),
      }
      queue.push(item)
      write(queue)
      return item
    },
    process: async (processor) => {
      let processed = 0
      let failed = 0
      let queue = read()

      while (queue.length > 0) {
        const item = queue[0]
        try {
          await processor(item)
          queue = queue.slice(1)
          write(queue)
          processed += 1
        } catch {
          failed += 1
          break
        }
      }

      return { processed, failed }
    },
    clear: () => write([]),
  }
}

export function getBrowserStorage(): KeyValueStorage {
  return window.localStorage
}

export const retryQueue = createRetryQueue(getBrowserStorage())

