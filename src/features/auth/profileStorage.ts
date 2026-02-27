import { normalizePhone } from '@/lib/utils/phone'

const AUTH_PROFILE_KEY = 'tailormade:auth-profiles'

type AuthProfiles = Record<string, { username: string }>

function readProfiles(): AuthProfiles {
  const raw = window.localStorage.getItem(AUTH_PROFILE_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as AuthProfiles
    return parsed ?? {}
  } catch {
    return {}
  }
}

function writeProfiles(profiles: AuthProfiles) {
  window.localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profiles))
}

export function getStoredUsername(phone: string): string | undefined {
  const key = normalizePhone(phone)
  const profiles = readProfiles()
  return profiles[key]?.username
}

export function saveStoredUsername(phone: string, username: string): void {
  const key = normalizePhone(phone)
  const profiles = readProfiles()
  profiles[key] = { username: username.trim() }
  writeProfiles(profiles)
}

