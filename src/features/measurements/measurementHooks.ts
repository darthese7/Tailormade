import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSessionStore } from '@/features/auth/sessionStore'
import { enqueueOrThrow } from '@/features/offline/syncWorker'
import { endpoints } from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/api/queryKeys'
import { measurementService } from '@/lib/api/services'
import {
  CreateJobFromMeasurementInput,
  Job,
  MeasurementPart,
  MeasurementRecord,
  MeasurementRecordCreateInput,
  MeasurementSnapshot,
} from '@/types/api'

function partsToSnapshot(measurementName: string, parts: MeasurementPart[]): MeasurementSnapshot {
  return {
    templateId: 'measurement-record',
    templateName: measurementName,
    fields: parts.map((part) => ({
      key: part.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: part.label,
      unit: part.unit,
      value: String(part.value),
    })),
  }
}

function createTempMeasurement(
  customerId: string,
  payload: MeasurementRecordCreateInput,
): MeasurementRecord {
  return {
    id: `offline-measure-${Date.now()}`,
    customerId,
    measurementName: payload.measurementName,
    parts: payload.parts,
    createdAt: new Date().toISOString(),
    linkedJobId: null,
    inspirationPhotos: payload.inspirationPhotos,
    fabricPhotos: payload.fabricPhotos,
  }
}

function createTempJobFromMeasurement(input: {
  measurementId: string
  customerId: string
  measurementName: string
  parts: MeasurementPart[]
  payload: CreateJobFromMeasurementInput
}): Job {
  const now = new Date().toISOString()
  return {
    id: `offline-job-${Date.now()}`,
    customerId: input.customerId,
    deliveryDate: input.payload.deliveryDate ?? null,
    agreedPrice: input.payload.agreedPrice ?? null,
    status: input.payload.status ?? 'ongoing',
    measurementSnapshot: partsToSnapshot(input.measurementName, input.parts),
    measurementRecordId: input.measurementId,
    createdAt: now,
    updatedAt: now,
  }
}

export function useMeasurementRecordsQuery(customerId?: string) {
  const token = useSessionStore((state) => state.session?.token)

  return useQuery({
    queryKey: [...queryKeys.measurements, token, customerId],
    enabled: Boolean(token && customerId),
    queryFn: () => measurementService.listByCustomer(customerId ?? '', token),
  })
}

export function useCreateMeasurementMutation() {
  const token = useSessionStore((state) => state.session?.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { customerId: string; payload: MeasurementRecordCreateInput }) => {
      try {
        return await measurementService.create(input.customerId, input.payload, token)
      } catch (error) {
        await enqueueOrThrow(error, {
          method: 'POST',
          path: endpoints.customersMeasurements(input.customerId),
          body: input.payload,
          token,
        })
        return createTempMeasurement(input.customerId, input.payload)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.measurements, token, variables.customerId],
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.customers })
    },
  })
}

export function useCreateJobFromMeasurementMutation() {
  const token = useSessionStore((state) => state.session?.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      measurementId: string
      customerId: string
      measurementName: string
      parts: MeasurementPart[]
      payload: CreateJobFromMeasurementInput
    }) => {
      try {
        const job = await measurementService.createJobFromMeasurement(
          input.measurementId,
          input.payload,
          token,
        )
        await measurementService.linkJob(input.measurementId, job.id, token)
        return job
      } catch (error) {
        await enqueueOrThrow(error, {
          method: 'POST',
          path: endpoints.measurementCreateJob(input.measurementId),
          body: input.payload,
          token,
        })
        return createTempJobFromMeasurement(input)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.measurements, token, variables.customerId],
      })
    },
  })
}

export function useDeleteMeasurementMutation() {
  const token = useSessionStore((state) => state.session?.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { measurementId: string; customerId: string }) => {
      await measurementService.remove(input.measurementId, token)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.measurements, token, variables.customerId],
      })
    },
  })
}

export function useUpdateMeasurementMutation() {
  const token = useSessionStore((state) => state.session?.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      measurementId: string
      customerId: string
      payload: MeasurementRecordCreateInput
    }) => {
      return measurementService.update(input.measurementId, input.payload, token)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.measurements, token, variables.customerId],
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export { partsToSnapshot }
