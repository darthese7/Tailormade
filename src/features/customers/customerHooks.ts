import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enqueueOrThrow } from '@/features/offline/syncWorker'
import { useSessionStore } from '@/features/auth/sessionStore'
import { endpoints } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/api/queryKeys'
import { customerService } from '@/lib/api/services'
import { AddCustomerInput } from '@/features/customers/schemas'
import { Customer } from '@/types/api'

function createTempCustomer(payload: AddCustomerInput): Customer {
  const now = new Date().toISOString()
  return {
    id: `offline-${Date.now()}`,
    name: payload.name,
    phone: payload.phone,
    notes: payload.notes,
    createdAt: now,
    updatedAt: now,
    jobCount: 0,
  }
}

export function useCustomersQuery(search?: string) {
  const token = useSessionStore((state) => state.session?.token)
  const normalizedSearch = search?.trim() ?? ''

  return useQuery({
    queryKey: [...queryKeys.customers, token, normalizedSearch],
    queryFn: () => customerService.list(token, normalizedSearch),
    enabled: Boolean(token),
  })
}

export function useCreateCustomerMutation() {
  const token = useSessionStore((state) => state.session?.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AddCustomerInput) => {
      try {
        return await customerService.create(payload, token)
      } catch (error) {
        await enqueueOrThrow(error, {
          method: 'POST',
          path: endpoints.customers,
          body: payload,
          token,
        })
        return createTempCustomer(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useUpsertCustomerMutation() {
  const token = useSessionStore((state) => state.session?.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AddCustomerInput) => {
      try {
        return await customerService.upsert(payload, token)
      } catch (error) {
        await enqueueOrThrow(error, {
          method: 'POST',
          path: endpoints.customers,
          body: payload,
          token,
        })
        return createTempCustomer(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}
