export const endpoints = {
  authRegister: '/auth/register',
  authLogin: '/auth/login',
  authVerifyOtp: '/auth/verify-otp',
  customers: '/customers',
  customersMeasurements: (customerId: string) => `/customers/${customerId}/measurements`,
  measurementById: (measurementId: string) => `/measurements/${measurementId}`,
  measurementCreateJob: (measurementId: string) => `/measurements/${measurementId}/create-job`,
  jobs: '/jobs',
  jobById: (jobId: string) => `/jobs/${jobId}`,
  dashboard: '/dashboard',
} as const
