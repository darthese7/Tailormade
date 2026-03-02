import { useMutation } from '@tanstack/react-query'
import { authService } from '@/lib/api/services'

export function useRegisterMutation() {
  return useMutation({
    mutationFn: authService.register,
  })
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: authService.login,
  })
}
