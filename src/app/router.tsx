import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { RequireAuth } from '@/app/RequireAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthOtpPage } from '@/features/auth/AuthOtpPage'
import { AuthPhonePage } from '@/features/auth/AuthPhonePage'
import { AuthUsernamePage } from '@/features/auth/AuthUsernamePage'
import { CustomerProfilePage } from '@/features/customers/CustomerProfilePage'
import { CustomersPage } from '@/features/customers/CustomersPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { JobDetailPage } from '@/features/jobs/JobDetailPage'
import { JobsPage } from '@/features/jobs/JobsPage'
import { NewJobPage } from '@/features/jobs/NewJobPage'

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/auth" element={<AuthPhonePage />} />
        <Route path="/auth/otp" element={<AuthOtpPage />} />
        <Route path="/auth/username" element={<AuthUsernamePage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:customerId" element={<CustomerProfilePage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/new" element={<NewJobPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}
