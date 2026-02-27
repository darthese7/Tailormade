import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessionStore } from '@/features/auth/sessionStore'

export function RequireAuth() {
  const session = useSessionStore((state) => state.session)
  const location = useLocation()

  if (!session?.token) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}

