import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '@/lib/api/client'
import logo from '@/assets/logo.svg'
import { useLoginMutation, useRegisterMutation } from '@/features/auth/authHooks'
import {
  loginSchema,
  signupSchema,
  type LoginSchemaInput,
  type SignupSchemaInput,
} from '@/features/auth/schemas'
import { useSessionStore } from '@/features/auth/sessionStore'
import { Button, Input } from '@/components/primitives'
import { cn } from '@/lib/utils/cn'
import { phoneForWhatsapp } from '@/lib/utils/phone'

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return fallback
}

export function AuthPhonePage() {
  const navigate = useNavigate()
  const session = useSessionStore((state) => state.session)
  const authMode = useSessionStore((state) => state.authMode)
  const setAuthMode = useSessionStore((state) => state.setAuthMode)
  const setSession = useSessionStore((state) => state.setSession)
  const loginMutation = useLoginMutation()
  const registerMutation = useRegisterMutation()
  const [showSupportHelp, setShowSupportHelp] = useState(false)
  const supportLine = String(import.meta.env.VITE_SUPPORT_WHATSAPP_PHONE ?? '').replace(
    /\D/g,
    '',
  )

  const loginForm = useForm<LoginSchemaInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  })

  const signupForm = useForm<SignupSchemaInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { phone: '', username: '', password: '' },
  })

  const loginPhone = useWatch({
    control: loginForm.control,
    name: 'phone',
  })
  const supportPhone = loginPhone ? phoneForWhatsapp(loginPhone) : ''
  const supportMessage = encodeURIComponent(
    `Hello, I forgot my Tailormade password. My registered phone number is ${
      supportPhone || '[add phone number]'
    }. Please help me reset it.`,
  )
  const supportHref = supportLine
    ? `https://wa.me/${supportLine}?text=${supportMessage}`
    : ''

  const onLogin = loginForm.handleSubmit(async (values) => {
    const authSession = await loginMutation.mutateAsync(values)
    setSession(authSession)
    navigate('/home', { replace: true })
  })

  const onSignup = signupForm.handleSubmit(async (values) => {
    const authSession = await registerMutation.mutateAsync(values)
    setSession(authSession)
    navigate('/home', { replace: true })
  })

  const loginError = loginMutation.isError
    ? errorMessage(loginMutation.error, 'Could not log in. Try again.')
    : ''
  const signupError = registerMutation.isError
    ? errorMessage(registerMutation.error, 'Could not create account. Try again.')
    : ''

  if (session?.token) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pt-4 pb-32">
        <header className="-mx-5 border-b border-gray-200 px-5 pb-4">
          <img src={logo} alt="Tailormade" className="h-7 w-auto" />
        </header>

        <section className="mt-6">
          <div className="grid grid-cols-2 rounded-full border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login')
                setShowSupportHelp(false)
              }}
              className={cn(
                'tap-feedback h-11 rounded-full text-sm font-semibold',
                authMode === 'login' ? 'bg-black text-white' : 'text-gray-500',
              )}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup')
                setShowSupportHelp(false)
              }}
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
            {authMode === 'login'
              ? 'Log in with your phone number and password.'
              : 'Create your account with your phone number, username, and password.'}
          </p>
        </section>

        {authMode === 'login' ? (
          <form id="auth-login-form" className="mt-6 space-y-4" onSubmit={onLogin}>
            <Input
              label="Phone Number"
              placeholder="0803 000 0000"
              inputMode="tel"
              autoComplete="tel"
              className="h-12"
              error={loginForm.formState.errors.phone?.message}
              {...loginForm.register('phone')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className="h-12"
              error={loginForm.formState.errors.password?.message}
              {...loginForm.register('password')}
            />

            <div>
              <button
                type="button"
                onClick={() => setShowSupportHelp((current) => !current)}
                className="tap-feedback text-sm font-semibold text-gray-700"
              >
                Forgot Password?
              </button>

              {showSupportHelp ? (
                <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Contact support on WhatsApp
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    We&apos;ll verify you manually, then reset your password for you.
                  </p>

                  {supportHref ? (
                    <a
                      href={supportHref}
                      target="_blank"
                      rel="noreferrer"
                      className="tap-feedback mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900"
                    >
                      Chat on WhatsApp
                    </a>
                  ) : (
                    <p className="mt-4 text-xs text-gray-500">
                      Support WhatsApp line is not configured yet.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            {loginError ? <p className="text-sm text-error">{loginError}</p> : null}
          </form>
        ) : (
          <form id="auth-signup-form" className="mt-6 space-y-4" onSubmit={onSignup}>
            <Input
              label="Phone Number"
              placeholder="0803 000 0000"
              inputMode="tel"
              autoComplete="tel"
              className="h-12"
              error={signupForm.formState.errors.phone?.message}
              {...signupForm.register('phone')}
            />

            <Input
              label="Enter Username"
              placeholder="e.g. Ese Tailor"
              autoComplete="nickname"
              className="h-12"
              error={signupForm.formState.errors.username?.message}
              {...signupForm.register('username')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              className="h-12"
              error={signupForm.formState.errors.password?.message}
              {...signupForm.register('password')}
            />

            <p className="text-xs text-gray-500">
              Choose a strong password (minimum 6 characters)
            </p>

            {signupError ? <p className="text-sm text-error">{signupError}</p> : null}
          </form>
        )}
      </div>

      <div className="fixed left-0 right-0 bottom-6 z-20">
        <div className="max-w-md mx-auto px-5">
          <Button
            form={authMode === 'login' ? 'auth-login-form' : 'auth-signup-form'}
            type="submit"
            fullWidth
            className="h-14 rounded-xl bg-black text-white text-lg font-semibold shadow-sm hover:bg-black/95"
            disabled={
              authMode === 'login'
                ? loginMutation.isPending
                : registerMutation.isPending
            }
          >
            {authMode === 'login'
              ? loginMutation.isPending
                ? 'Logging in...'
                : 'Log in'
              : registerMutation.isPending
                ? 'Creating account...'
                : 'Create account'}
          </Button>
        </div>
      </div>
    </div>
  )
}
