import { Job, JobStatus } from '@/types/api'

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

function endOfWeek(date: Date): Date {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? 0 : 7 - day
  copy.setDate(copy.getDate() + diff)
  return startOfDay(copy)
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'Not set'
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDateLabel(dateInput: string | null | undefined): string {
  if (!dateInput) {
    return 'Not set'
  }
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return dateInput
  }

  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatDayMonth(dateInput: string | null | undefined): string {
  if (!dateInput) {
    return 'Not set'
  }
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return dateInput
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'long',
  }).format(date)
}

export function calculateUrgencyMetrics(
  jobs: Job[],
  nowInput = new Date(),
): {
  overdueJobs: number
  dueToday: number
  dueThisWeek: number
  thisMonthIncome: number
} {
  const now = startOfDay(nowInput)
  const weekEnd = endOfWeek(now)
  const month = now.getMonth()
  const year = now.getFullYear()

  const activeJobs = jobs.filter((job) => job.status !== 'delivered')
  const deliveredJobs = jobs.filter((job) => job.status === 'delivered')

  const overdueJobs = activeJobs.filter((job) => {
    if (!job.deliveryDate) {
      return false
    }
    const delivery = startOfDay(new Date(job.deliveryDate))
    if (Number.isNaN(delivery.getTime())) {
      return false
    }
    return delivery < now
  }).length

  const dueToday = activeJobs.filter((job) => {
    if (!job.deliveryDate) {
      return false
    }
    const delivery = startOfDay(new Date(job.deliveryDate))
    if (Number.isNaN(delivery.getTime())) {
      return false
    }
    return sameDay(delivery, now)
  }).length

  const dueThisWeek = activeJobs.filter((job) => {
    if (!job.deliveryDate) {
      return false
    }
    const delivery = startOfDay(new Date(job.deliveryDate))
    if (Number.isNaN(delivery.getTime())) {
      return false
    }
    return delivery >= now && delivery <= weekEnd
  }).length

  const thisMonthIncome = deliveredJobs.reduce((sum, job) => {
    const deliveredAt = new Date(job.updatedAt)
    if (deliveredAt.getMonth() === month && deliveredAt.getFullYear() === year) {
      return sum + (job.agreedPrice ?? 0)
    }
    return sum
  }, 0)

  return { overdueJobs, dueToday, dueThisWeek, thisMonthIncome }
}

export function statusLabel(status: JobStatus): string {
  if (status === 'ongoing') {
    return 'Ongoing'
  }
  if (status === 'ready') {
    return 'Ready'
  }
  return 'Delivered'
}
