import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSessionStore } from '@/features/auth/sessionStore'
import { enqueueOrThrow } from '@/features/offline/syncWorker'
import { endpoints } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/api/queryKeys'
import { jobsService } from '@/lib/api/services'
import { NewJobInput } from '@/features/jobs/schemas'
import { Job, JobStatus, JobUpdateInput } from '@/types/api'

function createTempJob(payload: NewJobInput): Job {
  const now = new Date().toISOString()
  return {
    id: `offline-${Date.now()}`,
    customerId: payload.customerId,
    deliveryDate: payload.deliveryDate,
    agreedPrice: payload.agreedPrice,
    status: payload.status,
    measurementSnapshot: payload.measurementSnapshot,
    styleImageUrl: payload.styleImageUrl,
    fabricImageUrl: payload.fabricImageUrl,
    createdAt: now,
    updatedAt: now,
  }
}

export function useJobsQuery() {
  const token = useSessionStore((state) => state.session?.token)

  return useQuery({
    queryKey: [...queryKeys.jobs, token],
    queryFn: () => jobsService.list(token),
    enabled: Boolean(token),
  })
}

export function useCreateJobMutation() {
  const token = useSessionStore((state) => state.session?.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: NewJobInput) => {
      try {
        return await jobsService.create(payload, token)
      } catch (error) {
        await enqueueOrThrow(error, {
          method: 'POST',
          path: endpoints.jobs,
          body: payload,
          token,
        })
        return createTempJob(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useUpdateJobStatusMutation() {
  const token = useSessionStore((state) => state.session?.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: JobStatus }) => {
      const payload = { status }
      try {
        return await jobsService.updateStatus(jobId, payload, token)
      } catch (error) {
        await enqueueOrThrow(error, {
          method: 'PATCH',
          path: `${endpoints.jobs}/${jobId}`,
          body: payload,
          token,
        })
        return { id: jobId, status } as Job
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useUpdateJobMutation() {
  const token = useSessionStore((state) => state.session?.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ jobId, payload }: { jobId: string; payload: JobUpdateInput }) => {
      try {
        return await jobsService.update(jobId, payload, token)
      } catch (error) {
        await enqueueOrThrow(error, {
          method: 'PATCH',
          path: `${endpoints.jobs}/${jobId}`,
          body: payload,
          token,
        })
        return { id: jobId, ...payload } as Job
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}
