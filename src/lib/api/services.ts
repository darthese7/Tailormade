import { apiClient } from '@/lib/api/client'
import { endpoints } from '@/lib/api/endpoints'
import { mockDb } from '@/lib/api/mockDb'
import {
  AuthChangePasswordRequest,
  AuthAdminResetPasswordRequest,
  AuthLoginRequest,
  AuthRegisterRequest,
  AuthSession,
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
} from '@/types/api'

const USE_MOCK_API = !import.meta.env.VITE_API_BASE_URL

export const authService = {
  register: async (payload: AuthRegisterRequest) =>
    apiClient.post<AuthSession>(endpoints.authRegister, payload),
  login: async (payload: AuthLoginRequest) =>
    apiClient.post<AuthSession>(endpoints.authLogin, payload),
  updateProfile: async (payload: { username: string }, token?: string) =>
    apiClient.patch<AuthSession>(endpoints.authProfile, payload, { token }),
  changePassword: async (payload: AuthChangePasswordRequest, token?: string) =>
    apiClient.patch<{ success: boolean; message?: string }>(
      endpoints.authPassword,
      payload,
      { token },
    ),
  adminResetPassword: async (payload: AuthAdminResetPasswordRequest, adminSecret: string) =>
    apiClient.post<{ success: boolean; message?: string }>(
      endpoints.authAdminResetPassword,
      payload,
      {
        headers: {
          'x-admin-secret': adminSecret,
        },
      },
    ),
}

export const customerService = {
  list: async (token?: string, search?: string) => {
    if (USE_MOCK_API) {
      return mockDb.listCustomers(search)
    }
    return apiClient.get<Customer[]>(endpoints.customers, {
      token,
      query: { search },
    })
  },
  search: async (search: string, token?: string) => customerService.list(token, search),
  create: async (payload: CustomerCreateInput, token?: string) => {
    if (USE_MOCK_API) {
      return mockDb.createCustomer(payload)
    }
    return apiClient.post<Customer>(endpoints.customers, payload, { token })
  },
  upsert: async (payload: CustomerUpsertInput, token?: string) => {
    if (USE_MOCK_API) {
      return mockDb.upsertCustomer(payload)
    }
    return apiClient.post<Customer>(endpoints.customers, payload, { token })
  },
}

export const jobsService = {
  list: async (token?: string) => {
    if (USE_MOCK_API) {
      return mockDb.listJobs()
    }
    return apiClient.get<Job[]>(endpoints.jobs, { token })
  },
  create: async (payload: JobCreateInput, token?: string) => {
    if (USE_MOCK_API) {
      return mockDb.createJob(payload)
    }
    return apiClient.post<Job>(endpoints.jobs, payload, { token })
  },
  updateStatus: async (jobId: string, payload: JobStatusUpdateInput, token?: string) => {
    if (USE_MOCK_API) {
      return mockDb.updateJobStatus(jobId, payload)
    }
    return apiClient.patch<Job>(endpoints.jobById(jobId), payload, { token })
  },
  update: async (jobId: string, payload: JobUpdateInput, token?: string) => {
    if (USE_MOCK_API) {
      return mockDb.updateJob(jobId, payload)
    }
    return apiClient.patch<Job>(endpoints.jobById(jobId), payload, { token })
  },
}

export const measurementService = {
  listByCustomer: async (customerId: string, token?: string) => {
    if (USE_MOCK_API) {
      return mockDb.listMeasurements(customerId)
    }
    return apiClient.get<MeasurementRecord[]>(endpoints.customersMeasurements(customerId), {
      token,
    })
  },
  create: async (
    customerId: string,
    payload: MeasurementRecordCreateInput,
    token?: string,
  ) => {
    if (USE_MOCK_API) {
      return mockDb.createMeasurement(customerId, payload)
    }
    return apiClient.post<MeasurementRecord>(
      endpoints.customersMeasurements(customerId),
      payload,
      { token },
    )
  },
  linkJob: async (measurementId: string, jobId: string, token?: string) => {
    if (USE_MOCK_API) {
      return mockDb.linkMeasurementToJob(measurementId, jobId)
    }
    return apiClient.patch<MeasurementRecord>(
      endpoints.measurementCreateJob(measurementId),
      { linkedJobId: jobId },
      { token },
    )
  },
  createJobFromMeasurement: async (
    measurementId: string,
    payload: CreateJobFromMeasurementInput,
    token?: string,
  ) => {
    if (USE_MOCK_API) {
      return mockDb.createJobFromMeasurement(measurementId, payload).job
    }
    return apiClient.post<Job>(endpoints.measurementCreateJob(measurementId), payload, {
      token,
    })
  },
  remove: async (measurementId: string, token?: string) => {
    if (USE_MOCK_API) {
      mockDb.deleteMeasurement(measurementId)
      return
    }
    return apiClient.delete<void>(endpoints.measurementById(measurementId), {
      token,
      expectJson: false,
    })
  },
}

export const dashboardService = {
  get: async (token?: string) => {
    if (USE_MOCK_API) {
      return mockDb.getDashboard()
    }
    return apiClient.get<DashboardResponse>(endpoints.dashboard, { token })
  },
}
