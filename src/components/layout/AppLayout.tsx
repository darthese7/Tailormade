import { Outlet } from 'react-router-dom'
import { BottomNav, PageContainer } from '@/components/layout'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-white">
      <PageContainer>
        <Outlet />
      </PageContainer>
      <BottomNav />
    </div>
  )
}
