import { Home, Scissors, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/jobs', label: 'Jobs', icon: Scissors },
  { to: '/customers', label: 'Customers', icon: UserRound },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">
      <div className="max-w-md mx-auto h-16 px-5 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'tap-feedback flex h-12 min-h-12 flex-1 items-center justify-center gap-2',
                  isActive ? 'text-black' : 'text-gray-400',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative inline-flex h-5 w-5 items-center justify-center">
                    <Icon
                      size={20}
                      strokeWidth={2.2}
                      className={cn(isActive ? 'fill-current' : 'fill-none')}
                    />
                    {item.to === '/home' && isActive ? (
                      <span className="pointer-events-none absolute bottom-[2px] left-1/2 h-[7px] w-[5px] -translate-x-1/2 rounded-t-[2px] border border-[#B5B5B5] border-b-0" />
                    ) : null}
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

