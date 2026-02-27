export type JobStatus = 'ongoing' | 'ready' | 'delivered'

export interface ApiMessage {
  message?: string
}

export interface AuthOtpRequest {
  phone: string
}

export interface AuthOtpVerifyRequest {
  phone: string
  otp: string
}

export interface AuthSession {
  token: string
  userId?: string
  phone: string
  username?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  notes?: string
  createdAt: string
  updatedAt?: string
  jobCount?: number
}

export interface CustomerCreateInput {
  name: string
  phone: string
  notes?: string
}

export type CustomerUpsertInput = CustomerCreateInput

export interface MeasurementFieldSnapshot {
  key: string
  label: string
  unit: string
  value: string
}

export interface MeasurementSnapshot {
  templateId: string
  templateName: string
  fields: MeasurementFieldSnapshot[]
}

export interface MeasurementPart {
  label: string
  value: number
  unit: 'inches'
}

export interface MeasurementRecord {
  id: string
  customerId: string
  measurementName: string
  parts: MeasurementPart[]
  createdAt: string
  linkedJobId?: string | null
  inspirationPhotos?: string[]
  fabricPhotos?: string[]
}

export interface MeasurementRecordCreateInput {
  measurementName: string
  parts: MeasurementPart[]
  inspirationPhotos?: string[]
  fabricPhotos?: string[]
}

export interface Job {
  id: string
  customerId: string
  customerName?: string
  deliveryDate: string
  agreedPrice: number
  status: JobStatus
  measurementSnapshot: MeasurementSnapshot
  measurementRecordId?: string | null
  styleImageUrl?: string
  fabricImageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface JobCreateInput {
  customerId: string
  deliveryDate: string
  agreedPrice: number
  status: JobStatus
  measurementSnapshot: MeasurementSnapshot
  measurementRecordId?: string
  styleImageUrl?: string
  fabricImageUrl?: string
}

export interface CreateJobFromMeasurementInput {
  deliveryDate: string
  agreedPrice: number
  status?: JobStatus
}

export interface JobStatusUpdateInput {
  status: JobStatus
}

export interface JobUpdateInput {
  deliveryDate?: string
  agreedPrice?: number
  status?: JobStatus
  measurementSnapshot?: MeasurementSnapshot
}

export interface DashboardCustomer {
  id: string
  name: string
  phone: string
  orderCount: number
}

export interface DashboardResponse {
  overdueJobs: number
  dueToday: number
  dueThisWeek: number
  thisMonthIncome: number
  mostFrequentCustomers: DashboardCustomer[]
}

export interface DuplicateCustomerError extends ApiMessage {
  code?: 'DUPLICATE_PHONE'
  existingCustomer?: Customer
}
