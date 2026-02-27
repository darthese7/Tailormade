import { useMutation } from '@tanstack/react-query'
import { authService } from '@/lib/api/services'

export function useRequestOtpMutation() {
  return useMutation({
    mutationFn: authService.requestOtp,
  })
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: authService.verifyOtp,
  })
}

