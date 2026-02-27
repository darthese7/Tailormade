import { describe, expect, it } from 'vitest'
import { createRetryQueue } from '@/features/offline/retryQueue'

class MemoryStorage {
  private readonly store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }
}

describe('retryQueue', () => {
  it('enqueues and keeps FIFO order during processing', async () => {
    const storage = new MemoryStorage()
    const queue = createRetryQueue(storage)
    queue.enqueue({ method: 'POST', path: '/customers', body: { name: 'Ada' } })
    queue.enqueue({ method: 'PATCH', path: '/jobs/1', body: { status: 'ready' } })

    const processed: string[] = []
    const result = await queue.process(async (item) => {
      processed.push(item.path)
    })

    expect(result).toEqual({ processed: 2, failed: 0 })
    expect(processed).toEqual(['/customers', '/jobs/1'])
    expect(queue.length()).toBe(0)
  })

  it('stops processing and keeps failed item when processor throws', async () => {
    const storage = new MemoryStorage()
    const queue = createRetryQueue(storage)
    queue.enqueue({ method: 'POST', path: '/customers', body: { name: 'A' } })
    queue.enqueue({ method: 'POST', path: '/jobs', body: { agreedPrice: 5000 } })

    const result = await queue.process(async (item) => {
      if (item.path === '/customers') {
        throw new Error('offline')
      }
    })

    expect(result).toEqual({ processed: 0, failed: 1 })
    expect(queue.length()).toBe(2)
    expect(queue.list()[0]?.path).toBe('/customers')
  })
})

