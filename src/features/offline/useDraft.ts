import { useEffect, useMemo, useState } from 'react'
import { getJsonFromStorage, setJsonToStorage } from '@/lib/storage/localStorage'

function debounce<T extends (...args: never[]) => void>(fn: T, delay: number) {
  let timeout: number | undefined
  return (...args: Parameters<T>) => {
    if (timeout) {
      window.clearTimeout(timeout)
    }
    timeout = window.setTimeout(() => fn(...(args as never[])), delay)
  }
}

export function useDraft<T extends object>(storageKey: string, initialValue: T) {
  const [draft, setDraft] = useState<T>(() =>
    getJsonFromStorage<T>(window.localStorage, storageKey, initialValue),
  )

  const saveDebounced = useMemo(
    () =>
      debounce((value: T) => {
        setJsonToStorage(window.localStorage, storageKey, value)
      }, 300),
    [storageKey],
  )

  useEffect(() => {
    saveDebounced(draft)
  }, [draft, saveDebounced])

  const discardDraft = () => {
    window.localStorage.removeItem(storageKey)
    setDraft(initialValue)
  }

  return {
    draft,
    setDraft,
    discardDraft,
  }
}

