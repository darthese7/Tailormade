import { type LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Calendar,
  Clock,
  CreditCard,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppHeader } from '@/components/layout'
import { useDashboardQuery } from '@/features/dashboard/dashboardHooks'
import { useSessionStore } from '@/features/auth/sessionStore'

interface MetricCardProps {
  title: string
  value: number
  icon: LucideIcon
  badgeClassName: string
  actionHref?: string
}

function MetricCard({
  title,
  value,
  icon: Icon,
  badgeClassName,
  actionHref,
}: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${badgeClassName}`}>
        <Icon size={19} />
      </div>

      <p className="mt-4 text-sm font-medium text-gray-600">{title}</p>

      <div className="mt-6 flex items-end justify-between">
        <p className="text-3xl font-semibold text-black leading-none">{value}</p>
        {actionHref ? (
          <Link
            to={actionHref}
            className="tap-feedback text-xs font-semibold text-gray-900 flex items-center gap-1"
          >
            View Jobs
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const dashboardQuery = useDashboardQuery()
  const username = useSessionStore((state) => state.session?.username)
  const metrics = dashboardQuery.data ?? {
    overdueJobs: 0,
    dueToday: 0,
    dueThisWeek: 0,
    thisMonthIncome: 0,
    mostFrequentCustomers: [],
  }

  return (
    <div>
      <AppHeader />

      <section className="mt-5">
        <h1 className="text-4xl leading-tight tracking-tight">
          <span className="text-gray-500 font-medium">Welcome</span>{' '}
          <span className="text-black font-semibold">{username ?? 'Tailor'},</span>
        </h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Ready to take your next measurement?
        </p>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-4">
        <MetricCard
          title="Overdue Jobs"
          value={metrics.overdueJobs}
          icon={AlertTriangle}
          badgeClassName="bg-red-100 text-red-500"
          actionHref="/jobs"
        />
        <MetricCard
          title="Due Today"
          value={metrics.dueToday}
          icon={Calendar}
          badgeClassName="bg-orange-100 text-orange-600"
          actionHref="/jobs"
        />
        <MetricCard
          title="Due This Week"
          value={metrics.dueThisWeek}
          icon={Clock}
          badgeClassName="bg-cyan-100 text-cyan-600"
          actionHref="/jobs"
        />
        <MetricCard
          title="This Month Income"
          value={metrics.thisMonthIncome}
          icon={CreditCard}
          badgeClassName="bg-green-100 text-green-600"
        />
      </section>

      <div className="fixed left-0 right-0 bottom-24 z-20">
        <div className="max-w-md mx-auto px-5">
          <Link
            to="/jobs/new"
            className="tap-feedback w-full h-14 rounded-xl bg-black text-white text-lg font-semibold shadow-sm inline-flex items-center justify-center"
          >
            Take Measurement
          </Link>
        </div>
      </div>
    </div>
  )
}
