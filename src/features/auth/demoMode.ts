import { AuthSession } from '@/types/api'
import { getStoredUsername } from '@/features/auth/profileStorage'

const DEMO_OTP_KEY = 'tailormade:demo-otp'
const DEMO_PHONE_KEY = 'tailormade:demo-phone'
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

export function requestDemoOtp(phone: string): { success: boolean; message: string } {
  window.localStorage.setItem(DEMO_OTP_KEY, DEMO_OTP)
  window.localStorage.setItem(DEMO_PHONE_KEY, phone)
  return {
    success: true,
    message: 'Demo OTP sent. Use 1234 to continue.',
  }
}

export function verifyDemoOtp(phone: string, otp: string): AuthSession {
  const savedOtp = window.localStorage.getItem(DEMO_OTP_KEY)
  const savedPhone = window.localStorage.getItem(DEMO_PHONE_KEY)
  const validOtp = savedOtp ?? DEMO_OTP

  if (otp !== validOtp || (savedPhone && savedPhone !== phone)) {
    throw new Error('Invalid OTP. In demo mode, use 1234.')
  }

  const username = getStoredUsername(phone)

  return {
    token: `demo-token-${Date.now()}`,
    phone,
    userId: 'demo-user',
    username,
  }
}
