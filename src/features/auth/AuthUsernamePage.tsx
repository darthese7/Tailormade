import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/features/auth/AuthShell'
import { saveStoredUsername } from '@/features/auth/profileStorage'
import { useSessionStore } from '@/features/auth/sessionStore'
import { usernameSchema, type UsernameSchemaInput } from '@/features/auth/schemas'
import { Button, Input } from '@/components/primitives'

export function AuthUsernamePage() {
  const navigate = useNavigate()
  const authMode = useSessionStore((state) => state.authMode)
  const pendingSession = useSessionStore((state) => state.pendingSession)
  const setSession = useSessionStore((state) => state.setSession)
  const clearPendingSession = useSessionStore((state) => state.clearPendingSession)
  const setOtpPhone = useSessionStore((state) => state.setOtpPhone)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UsernameSchemaInput>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: pendingSession?.username ?? '',
    },
  })

  if (!pendingSession || authMode !== 'signup') {
    return <Navigate to="/auth" replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    const username = values.username.trim()
    saveStoredUsername(pendingSession.phone, username)
    setSession({ ...pendingSession, username })
    clearPendingSession()
    setOtpPhone('')
    navigate('/home', { replace: true })
  })

  return (
    <AuthShell
      title="Enter Username"
      subtitle="This will be displayed on your dashboard after sign up."
      footer={
        <Button
          form="auth-username-form"
          type="submit"
          fullWidth
          className="h-14 rounded-xl bg-black text-white text-lg font-semibold shadow-sm hover:bg-black/95"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Finish Setup'}
        </Button>
      }
    >
      <form id="auth-username-form" className="space-y-4" onSubmit={onSubmit}>
        <Input
          label="Enter Username"
          placeholder="e.g. Ese Tailor"
          autoComplete="nickname"
          error={errors.username?.message}
          {...register('username')}
        />
      </form>
    </AuthShell>
  )
}
