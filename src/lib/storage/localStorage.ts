export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function getJsonFromStorage<T>(
  storage: KeyValueStorage,
  key: string,
  fallback: T,
): T {
  const raw = storage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setJsonToStorage(
  storage: KeyValueStorage,
  key: string,
  value: unknown,
): void {
  storage.setItem(key, JSON.stringify(value))
}

