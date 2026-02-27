import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '@/lib/api/client'
import logo from '@/assets/logo.svg'
import { useRequestOtpMutation } from '@/features/auth/authHooks'
import { requestOtpSchema, type RequestOtpSchemaInput } from '@/features/auth/schemas'
import { useSessionStore } from '@/features/auth/sessionStore'
import { Button, Input } from '@/components/primitives'
import { cn } from '@/lib/utils/cn'

export function AuthPhonePage() {
  const navigate = useNavigate()
  const session = useSessionStore((state) => state.session)
  const authMode = useSessionStore((state) => state.authMode)
  const setAuthMode = useSessionStore((state) => state.setAuthMode)
  const setOtpPhone = useSessionStore((state) => state.setOtpPhone)
  const mutation = useRequestOtpMutation()
  const [rateLimitMessage, setRateLimitMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestOtpSchemaInput>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: { phone: '' },
  })

  if (session?.token) {
    return <Navigate to="/home" replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setRateLimitMessage('')
    try {
      await mutation.mutateAsync({ phone: values.phone })
      setOtpPhone(values.phone)
      navigate('/auth/otp', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setRateLimitMessage('Too many OTP requests. Please wait and try again.')
      }
    }
  })

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pt-4 pb-32">
        <header className="border-b border-gray-200 pb-4">
          <img src={logo} alt="Tailormade" className="h-8 w-auto" />
        </header>

        <section className="mt-6">
          <div className="grid grid-cols-2 rounded-full border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={cn(
                'tap-feedback h-11 rounded-full text-sm font-semibold',
                authMode === 'login' ? 'bg-black text-white' : 'text-gray-500',
              )}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={cn(
                'tap-feedback h-11 rounded-full text-sm font-semibold',
                authMode === 'signup' ? 'bg-black text-white' : 'text-gray-500',
              )}
            >
              Sign up
            </button>
          </div>
        </section>

        <section className="mt-10">
          <h3 className="text-xl font-semibold leading-tight tracking-tight text-black">
            {authMode === 'login' ? 'Welcome back' : 'Create account'}
          </h3>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Enter your phone number to continue with OTP.
          </p>
        </section>

        <form id="auth-phone-form" className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Phone Number"
            placeholder="0803 000 0000"
            inputMode="tel"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />

          {rateLimitMessage ? <p className="text-sm text-error">{rateLimitMessage}</p> : null}
          {mutation.isError && !rateLimitMessage ? (
            <p className="text-sm text-error">Could not request OTP. Try again.</p>
          ) : null}
        </form>
      </div>

      <div className="fixed left-0 right-0 bottom-6 z-20">
        <div className="max-w-md mx-auto px-5">
          <Button
            form="auth-phone-form"
            type="submit"
            fullWidth
            className="h-14 rounded-xl bg-black text-white text-lg font-semibold shadow-sm hover:bg-black/95"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Requesting OTP...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
