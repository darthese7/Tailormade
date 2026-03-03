import { FormEvent, ReactNode, useState } from 'react'
import { Eye, EyeOff, Lock, LogOut, PencilLine, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logo from '@/assets/logo.svg'
import { Button, Input, Modal, useToast } from '@/components/primitives'
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
  const pushToast = useToast()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

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

  const resetPasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setPasswordError('')
  }

  const handleOpenChangePassword = () => {
    setIsMenuOpen(false)
    resetPasswordForm()
    setIsPasswordModalOpen(true)
  }

  const handleCloseChangePassword = () => {
    if (isSavingPassword) {
      return
    }

    setIsPasswordModalOpen(false)
    resetPasswordForm()
  }

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session) {
      return
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    try {
      setPasswordError('')
      setIsSavingPassword(true)
      const response = await authService.changePassword(
        {
          currentPassword,
          newPassword,
        },
        session.token,
      )
      pushToast(response.message || 'Password updated.', 'success')
      setIsPasswordModalOpen(false)
      resetPasswordForm()
    } catch (error) {
      setPasswordError(
        error instanceof Error && error.message
          ? error.message
          : 'Could not update password right now.',
      )
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <>
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
              onClick={handleOpenChangePassword}
              className="tap-feedback flex h-12 w-full items-center gap-2 px-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <Lock size={16} />
              Change password
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

      <Modal
        open={isPasswordModalOpen}
        title="Change password"
        onClose={handleCloseChangePassword}
      >
        <form className="space-y-4" onSubmit={(event) => void handleChangePassword(event)}>
          <p className="text-sm text-gray-500">
            Enter your current password, then set a new one.
          </p>

          <Input
            label="Current password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="h-12"
            autoComplete="current-password"
            endAdornment={
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="text-gray-500"
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <Input
            label="New password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="h-12"
            autoComplete="new-password"
            hint="Minimum 6 characters"
            endAdornment={
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="text-gray-500"
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <Input
            label="Confirm new password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-12"
            autoComplete="new-password"
            error={passwordError || undefined}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-gray-500"
                aria-label={
                  showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                }
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseChangePassword}
              disabled={isSavingPassword}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? 'Saving...' : 'Update'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
