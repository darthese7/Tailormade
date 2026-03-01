import { ApiError } from '@/lib/api/client'
import { AuthSession } from '@/types/api'
import { getStoredUsername, hasStoredUsername } from '@/features/auth/profileStorage'

const DEMO_OTP_KEY = 'tailormade:demo-otp'
const DEMO_PHONE_KEY = 'tailormade:demo-phone'
const DEMO_MODE_KEY = 'tailormade:demo-auth-mode'
const DEMO_OTP = '1234'

export function isDemoAuthEnabled(): boolean {
  const configured = import.meta.env.VITE_DEMO_AUTH
  if (configured === 'true') {
    return true
  }
  if (configured === 'false') {
    return false
  }

  return !import.meta.env.VITE_API_BASE_URL
}

export function requestDemoOtp(
  phone: string,
  mode: 'login' | 'signup',
): { success: boolean; message: string } {
  if (mode === 'login' && !hasStoredUsername(phone)) {
    throw new ApiError(404, 'No account found for this phone number. Sign up first.')
  }

  if (mode === 'signup' && hasStoredUsername(phone)) {
    throw new ApiError(409, 'Account already exists. Log in instead.')
  }

  window.localStorage.setItem(DEMO_OTP_KEY, DEMO_OTP)
  window.localStorage.setItem(DEMO_PHONE_KEY, phone)
  window.localStorage.setItem(DEMO_MODE_KEY, mode)
  return {
    success: true,
    message: 'Demo OTP sent. Use 1234 to continue.',
  }
}

export function verifyDemoOtp(
  phone: string,
  otp: string,
  mode: 'login' | 'signup',
): AuthSession {
  const savedOtp = window.localStorage.getItem(DEMO_OTP_KEY)
  const savedPhone = window.localStorage.getItem(DEMO_PHONE_KEY)
  const savedMode = window.localStorage.getItem(DEMO_MODE_KEY)
  const validOtp = savedOtp ?? DEMO_OTP

  if (
    otp !== validOtp ||
    (savedPhone && savedPhone !== phone) ||
    (savedMode && savedMode !== mode)
  ) {
    throw new ApiError(401, 'Invalid OTP. In demo mode, use 1234.')
  }

  if (mode === 'login' && !hasStoredUsername(phone)) {
    throw new ApiError(404, 'No account found for this phone number. Sign up first.')
  }

  const username = mode === 'login' ? getStoredUsername(phone) : undefined

  return {
    token: `demo-token-${Date.now()}`,
    phone,
    userId: 'demo-user',
    username,
  }
}
