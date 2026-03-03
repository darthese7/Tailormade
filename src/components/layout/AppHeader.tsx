import { ReactNode, useState } from 'react'
import { LogOut, PencilLine, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logo from '@/assets/logo.svg'
import { useSessionStore } from '@/features/auth/sessionStore'
import { authService } from '@/lib/api/services'
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
        {right ??
          (onAvatarClick ? (
            <button
              type="button"
              aria-label={avatarAriaLabel}
              onClick={onAvatarClick}
              className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white"
            >
              <User size={18} />
            </button>
          ) : (
            <ProfileMenuButton avatarAriaLabel={avatarAriaLabel} />
          ))}
      </div>
    </header>
  )
}

function ProfileMenuButton({ avatarAriaLabel }: { avatarAriaLabel: string }) {
  const navigate = useNavigate()
  const session = useSessionStore((state) => state.session)
  const clearSession = useSessionStore((state) => state.clearSession)
  const setSession = useSessionStore((state) => state.setSession)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
      const updatedSession = await authService.updateProfile(
        { username: trimmed },
        session.token,
      )
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
    <div className="relative z-40">
      {isMenuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      <button
        type="button"
        aria-label={avatarAriaLabel}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="relative z-40 h-10 w-10 rounded-full bg-black flex items-center justify-center text-white tap-feedback"
      >
        <User size={18} />
      </button>

      {isMenuOpen ? (
        <div className="absolute right-0 z-40 mt-2 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-sm">
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
  )
}
