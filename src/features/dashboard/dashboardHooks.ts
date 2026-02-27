import { useQuery } from '@tanstack/react-query'
import { useSessionStore } from '@/features/auth/sessionStore'
import { queryKeys } from '@/lib/api/queryKeys'
import { customerService, dashboardService, jobsService } from '@/lib/api/services'
import { calculateUrgencyMetrics } from '@/lib/utils/date'
import { Customer, DashboardCustomer, DashboardResponse, Job } from '@/types/api'

function topCustomers(customers: Customer[], jobs: Job[]): DashboardCustomer[] {
  const counts = new Map<string, number>()
  jobs.forEach((job) => {
    counts.set(job.customerId, (counts.get(job.customerId) ?? 0) + 1)
  })

  return customers
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      orderCount: counts.get(customer.id) ?? 0,
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5)
}

function computeFallbackDashboard(customers: Customer[], jobs: Job[]): DashboardResponse {
  const metrics = calculateUrgencyMetrics(jobs)
  return {
    ...metrics,
    mostFrequentCustomers: topCustomers(customers, jobs),
  }
}

export function useDashboardQuery() {
  const token = useSessionStore((state) => state.session?.token)

  return useQuery({
    queryKey: [...queryKeys.dashboard, token],
    enabled: Boolean(token),
    queryFn: async () => {
      try {
        return await dashboardService.get(token)
      } catch {
        try {
          const [customers, jobs] = await Promise.all([
            customerService.list(token),
            jobsService.list(token),
          ])
          return computeFallbackDashboard(customers, jobs)
        } catch {
          return {
            overdueJobs: 0,
            dueToday: 0,
            dueThisWeek: 0,
            thisMonthIncome: 0,
            mostFrequentCustomers: [],
          }
        }
      }
    },
  })
}
