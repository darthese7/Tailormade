import { ReactNode } from 'react'
import { User } from 'lucide-react'
import logo from '@/assets/logo.svg'
import { cn } from '@/lib/utils/cn'

interface AppHeaderProps {
  right?: ReactNode
  onAvatarClick?: () => void
  avatarAriaLabel?: string
  className?: string
}

export function AppHeader({
  right,
  onAvatarClick,
  avatarAriaLabel = 'Profile',
  className,
}: AppHeaderProps) {
  return (
    <header className={cn('-mx-5 border-b border-gray-200 px-5 pb-4', className)}>
      <div className="flex items-center justify-between">
        <img src={logo} alt="Tailormade" className="h-8 w-auto" />
        {right ?? (
          <button
            type="button"
            aria-label={avatarAriaLabel}
            onClick={onAvatarClick}
            className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white"
          >
            <User size={18} />
          </button>
        )}
      </div>
    </header>
  )
}
