import { useState } from 'react'
import { type LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Calendar,
  Clock,
  CreditCard,
  LogOut,
  PencilLine,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '@/assets/logo.svg'
import { useDashboardQuery } from '@/features/dashboard/dashboardHooks'
import { useSessionStore } from '@/features/auth/sessionStore'
import { authService } from '@/lib/api/services'

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
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const dashboardQuery = useDashboardQuery()
  const session = useSessionStore((state) => state.session)
  const username = useSessionStore((state) => state.session?.username)
  const clearSession = useSessionStore((state) => state.clearSession)
  const setSession = useSessionStore((state) => state.setSession)
  const metrics = dashboardQuery.data ?? {
    overdueJobs: 0,
    dueToday: 0,
    dueThisWeek: 0,
    thisMonthIncome: 0,
    mostFrequentCustomers: [],
  }

  const handleEditUsername = async () => {
    setIsMenuOpen(false)
    if (!session) {
      return
    }

    const currentUsername = session.username ?? ''
    const input = window.prompt('Enter your username', currentUsername)
    if (input === null) {
      return
    }

    const trimmed = input.trim()
    if (trimmed.length < 2) {
      window.alert('Username must be at least 2 characters.')
      return
    }

    try {
      const updatedSession = await authService.updateProfile({ username: trimmed }, session.token)
      setSession(updatedSession)
    } catch {
      window.alert('Could not update username right now.')
    }
  }

  const handleLogout = () => {
    setIsMenuOpen(false)
    clearSession()
    navigate('/auth', { replace: true })
  }

  return (
    <div>
      {isMenuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      <div className="-mx-5 border-b border-gray-200 px-5 pb-4">
        <div className="flex items-center justify-between">
          <img src={logo} alt="Tailormade" className="h-7 w-auto" />

          <div className="relative z-40">
            <button
              type="button"
              aria-label="Profile menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white tap-feedback"
            >
              <UserRound size={18} />
            </button>

            {isMenuOpen ? (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => void handleEditUsername()}
                  className="tap-feedback flex h-12 w-full items-center gap-2 px-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  <PencilLine size={16} />
                  Edit username
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="tap-feedback flex h-12 w-full items-center gap-2 px-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

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
