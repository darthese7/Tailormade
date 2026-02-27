import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '@/lib/api/client'
import { useVerifyOtpMutation } from '@/features/auth/authHooks'
import { isDemoAuthEnabled } from '@/features/auth/demoMode'
import { getStoredUsername } from '@/features/auth/profileStorage'
import { useSessionStore } from '@/features/auth/sessionStore'
import { verifyOtpSchema, type VerifyOtpSchemaInput } from '@/features/auth/schemas'
import { AuthShell } from '@/features/auth/AuthShell'
import { Button, Input } from '@/components/primitives'

export function AuthOtpPage() {
  const navigate = useNavigate()
  const otpPhone = useSessionStore((state) => state.otpPhone)
  const authMode = useSessionStore((state) => state.authMode)
  const setSession = useSessionStore((state) => state.setSession)
  const setPendingSession = useSessionStore((state) => state.setPendingSession)
  const setOtpPhone = useSessionStore((state) => state.setOtpPhone)
  const mutation = useVerifyOtpMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyOtpSchemaInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { otp: '' },
  })

  if (!otpPhone) {
    return <Navigate to="/auth" replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    const session = await mutation.mutateAsync({
      phone: otpPhone,
      otp: values.otp,
    })

    const username = session.username ?? getStoredUsername(session.phone)
    if (authMode === 'login') {
      setSession({ ...session, username })
      setOtpPhone('')
      navigate('/home', { replace: true })
      return
    }

    setPendingSession({ ...session, username })
    navigate('/auth/username', { replace: true })
  })

  let errorText = ''
  if (mutation.isError) {
    if (mutation.error instanceof ApiError) {
      errorText = mutation.error.message
    } else {
      errorText = 'OTP verification failed. Please try again.'
    }
  }

  return (
    <AuthShell
      title="Verify OTP"
      subtitle={`Enter the code sent to ${otpPhone}.`}
      footer={
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            className="h-14 flex-1 text-base font-semibold"
            onClick={() => navigate('/auth', { replace: true })}
            disabled={mutation.isPending}
          >
            Back
          </Button>
          <Button
            form="auth-otp-form"
            type="submit"
            className="h-14 flex-[2] rounded-xl bg-black text-white text-lg font-semibold shadow-sm hover:bg-black/95"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Verifying...' : 'Continue'}
          </Button>
        </div>
      }
    >
      <form id="auth-otp-form" className="space-y-4" onSubmit={onSubmit}>
        <Input
          label="One-Time Password"
          placeholder="1234"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          error={errors.otp?.message}
          {...register('otp')}
        />

        {isDemoAuthEnabled() ? (
          <p className="text-xs text-gray-500">Demo mode: use OTP `1234`.</p>
        ) : null}

        {errorText ? <p className="text-sm text-error">{errorText}</p> : null}
      </form>
    </AuthShell>
  )
}
