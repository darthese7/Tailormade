import { ApiError } from '@/lib/api/client'
import { getJsonFromStorage, setJsonToStorage } from '@/lib/storage/localStorage'
import { calculateUrgencyMetrics } from '@/lib/utils/date'
import { normalizePhone } from '@/lib/utils/phone'
import {
  CreateJobFromMeasurementInput,
  Customer,
  CustomerCreateInput,
  CustomerUpsertInput,
  DashboardResponse,
  Job,
  JobCreateInput,
  JobUpdateInput,
  JobStatusUpdateInput,
  MeasurementRecord,
  MeasurementRecordCreateInput,
  MeasurementSnapshot,
} from '@/types/api'

const STORAGE_KEY = 'tailormade:mock-db:v1'

interface MockDbState {
  customers: Customer[]
  jobs: Job[]
  measurements: MeasurementRecord[]
}

const defaultState: MockDbState = {
  customers: [],
  jobs: [],
  measurements: [],
}

function nowIso(): string {
  return new Date().toISOString()
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

function readState(): MockDbState {
  return getJsonFromStorage<MockDbState>(window.localStorage, STORAGE_KEY, defaultState)
}

function writeState(state: MockDbState): void {
  setJsonToStorage(window.localStorage, STORAGE_KEY, state)
}

function measurementToSnapshot(record: MeasurementRecord): MeasurementSnapshot {
  return {
    templateId: 'measurement-record',
    templateName: record.measurementName,
    fields: record.parts.map((part) => ({
      key: part.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: part.label,
      unit: part.unit,
      value: String(part.value),
    })),
  }
}

function duplicatePhoneError(existingCustomer: Customer): ApiError {
  return new ApiError(409, 'Customer phone already exists.', {
    code: 'DUPLICATE_PHONE',
    existingCustomer,
  })
}

export const mockDb = {
  listCustomers(search?: string): Customer[] {
    const state = readState()
    const query = search?.trim().toLowerCase()
    const list = !query
      ? state.customers
      : state.customers.filter((customer) =>
          customer.name.toLowerCase().includes(query),
        )

    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  createCustomer(payload: CustomerCreateInput): Customer {
    const state = readState()
    const normalizedPhone = normalizePhone(payload.phone)
    const existingByPhone = state.customers.find(
      (customer) => normalizePhone(customer.phone) === normalizedPhone,
    )

    if (existingByPhone) {
      throw duplicatePhoneError(existingByPhone)
    }

    const name = payload.name.trim()
    const existingByName = state.customers.find(
      (customer) => normalizeName(customer.name) === normalizeName(name),
    )
    if (existingByName) {
      const updated: Customer = {
        ...existingByName,
        phone: normalizedPhone,
        notes: payload.notes,
        updatedAt: nowIso(),
      }
      state.customers = state.customers.map((customer) =>
        customer.id === updated.id ? updated : customer,
      )
      writeState(state)
      return updated
    }

    const created: Customer = {
      id: createId('cus'),
      name,
      phone: normalizedPhone,
      notes: payload.notes,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      jobCount: 0,
    }

    state.customers.push(created)
    writeState(state)
    return created
  },

  upsertCustomer(payload: CustomerUpsertInput): Customer {
    const state = readState()
    const normalizedName = normalizeName(payload.name)
    const normalizedPhone = normalizePhone(payload.phone)
    const existingByName = state.customers.find(
      (customer) => normalizeName(customer.name) === normalizedName,
    )

    if (existingByName) {
      const updated: Customer = {
        ...existingByName,
        phone: normalizedPhone,
        notes: payload.notes,
        updatedAt: nowIso(),
      }
      state.customers = state.customers.map((customer) =>
        customer.id === updated.id ? updated : customer,
      )
      writeState(state)
      return updated
    }

    const existingByPhone = state.customers.find(
      (customer) => normalizePhone(customer.phone) === normalizedPhone,
    )
    if (existingByPhone) {
      throw duplicatePhoneError(existingByPhone)
    }

    const created: Customer = {
      id: createId('cus'),
      name: payload.name.trim(),
      phone: normalizedPhone,
      notes: payload.notes,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      jobCount: 0,
    }

    state.customers.push(created)
    writeState(state)
    return created
  },

  listJobs(): Job[] {
    const state = readState()
    return [...state.jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  createJob(payload: JobCreateInput): Job {
    const state = readState()
    const customer = state.customers.find((item) => item.id === payload.customerId)
    const created: Job = {
      id: createId('job'),
      customerId: payload.customerId,
      customerName: customer?.name,
      deliveryDate: payload.deliveryDate ?? null,
      agreedPrice: payload.agreedPrice ?? null,
      status: payload.status,
      measurementSnapshot: payload.measurementSnapshot,
      measurementRecordId: payload.measurementRecordId,
      styleImageUrl: payload.styleImageUrl,
      fabricImageUrl: payload.fabricImageUrl,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    state.jobs.push(created)
    if (customer) {
      state.customers = state.customers.map((item) =>
        item.id === customer.id
          ? { ...item, jobCount: (item.jobCount ?? 0) + 1, updatedAt: nowIso() }
          : item,
      )
    }

    writeState(state)
    return created
  },

  updateJobStatus(jobId: string, payload: JobStatusUpdateInput): Job {
    return this.updateJob(jobId, payload)
  },

  updateJob(jobId: string, payload: JobUpdateInput): Job {
    const state = readState()
    const existing = state.jobs.find((job) => job.id === jobId)

    if (!existing) {
      throw new ApiError(404, 'Job not found')
    }

    const updated: Job = {
      ...existing,
      ...payload,
      updatedAt: nowIso(),
    }

    state.jobs = state.jobs.map((job) => (job.id === jobId ? updated : job))
    writeState(state)
    return updated
  },

  getDashboard(): DashboardResponse {
    const state = readState()
    const metrics = calculateUrgencyMetrics(state.jobs)
    const counts = new Map<string, number>()

    state.jobs.forEach((job) => {
      counts.set(job.customerId, (counts.get(job.customerId) ?? 0) + 1)
    })

    const mostFrequentCustomers = state.customers
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        orderCount: counts.get(customer.id) ?? 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5)

    return {
      ...metrics,
      mostFrequentCustomers,
    }
  },

  listMeasurements(customerId: string): MeasurementRecord[] {
    const state = readState()
    return state.measurements
      .filter((measurement) => measurement.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  createMeasurement(
    customerId: string,
    payload: MeasurementRecordCreateInput,
  ): MeasurementRecord {
    const state = readState()
    const customer = state.customers.find((item) => item.id === customerId)

    if (!customer) {
      throw new ApiError(404, 'Customer not found')
    }

    const created: MeasurementRecord = {
      id: createId('measure'),
      customerId,
      measurementName: payload.measurementName.trim(),
      parts: payload.parts,
      createdAt: nowIso(),
      linkedJobId: null,
      inspirationPhotos: payload.inspirationPhotos ?? [],
      fabricPhotos: payload.fabricPhotos ?? [],
    }

    state.measurements.push(created)
    writeState(state)
    return created
  },

  updateMeasurement(
    measurementId: string,
    payload: MeasurementRecordCreateInput,
  ): MeasurementRecord {
    const state = readState()
    const existing = state.measurements.find((item) => item.id === measurementId)

    if (!existing) {
      throw new ApiError(404, 'Measurement record not found')
    }

    const updated: MeasurementRecord = {
      ...existing,
      measurementName: payload.measurementName.trim(),
      parts: payload.parts,
      inspirationPhotos: payload.inspirationPhotos ?? [],
      fabricPhotos: payload.fabricPhotos ?? [],
    }

    state.measurements = state.measurements.map((item) =>
      item.id === measurementId ? updated : item,
    )

    if (existing.linkedJobId) {
      state.jobs = state.jobs.map((job) => {
        if (job.id !== existing.linkedJobId) {
          return job
        }
        return {
          ...job,
          measurementSnapshot: measurementToSnapshot(updated),
          updatedAt: nowIso(),
        }
      })
    }

    writeState(state)
    return updated
  },

  linkMeasurementToJob(measurementId: string, jobId: string): MeasurementRecord {
    const state = readState()
    const existing = state.measurements.find((item) => item.id === measurementId)

    if (!existing) {
      throw new ApiError(404, 'Measurement record not found')
    }

    const updated: MeasurementRecord = {
      ...existing,
      linkedJobId: jobId,
    }

    state.measurements = state.measurements.map((item) =>
      item.id === measurementId ? updated : item,
    )
    writeState(state)
    return updated
  },

  deleteMeasurement(measurementId: string): void {
    const state = readState()
    const existing = state.measurements.find((item) => item.id === measurementId)

    if (!existing) {
      throw new ApiError(404, 'Measurement record not found')
    }

    state.measurements = state.measurements.filter((item) => item.id !== measurementId)
    writeState(state)
  },

  createJobFromMeasurement(
    measurementId: string,
    payload: CreateJobFromMeasurementInput,
  ): { job: Job; measurement: MeasurementRecord } {
    const state = readState()
    const measurement = state.measurements.find((item) => item.id === measurementId)

    if (!measurement) {
      throw new ApiError(404, 'Measurement record not found')
    }

    const customer = state.customers.find((item) => item.id === measurement.customerId)
    if (!customer) {
      throw new ApiError(404, 'Customer not found')
    }

    const deliveryDate = payload.deliveryDate?.trim() ? payload.deliveryDate.trim() : null
    const agreedPrice =
      payload.agreedPrice === null || payload.agreedPrice === undefined
        ? null
        : Number(payload.agreedPrice)

    if (!deliveryDate && agreedPrice === null) {
      throw new ApiError(400, 'Delivery date or agreed price is required.')
    }
    if (agreedPrice !== null && (!Number.isFinite(agreedPrice) || agreedPrice <= 0)) {
      throw new ApiError(400, 'Agreed price must be greater than 0.')
    }

    const createdJob: Job = {
      id: createId('job'),
      customerId: measurement.customerId,
      customerName: customer.name,
      deliveryDate,
      agreedPrice,
      status: payload.status ?? 'ongoing',
      measurementSnapshot: measurementToSnapshot(measurement),
      measurementRecordId: measurement.id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    const linkedMeasurement: MeasurementRecord = {
      ...measurement,
      linkedJobId: createdJob.id,
    }

    state.jobs.push(createdJob)
    state.measurements = state.measurements.map((item) =>
      item.id === measurement.id ? linkedMeasurement : item,
    )
    state.customers = state.customers.map((item) =>
      item.id === customer.id
        ? { ...item, jobCount: (item.jobCount ?? 0) + 1, updatedAt: nowIso() }
        : item,
    )

    writeState(state)
    return { job: createdJob, measurement: linkedMeasurement }
  },
}
