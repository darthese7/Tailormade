import { type ReactNode } from 'react'
import logo from '@/assets/logo.svg'

interface AuthShellProps {
  title: ReactNode
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pt-4 pb-32">
        <header className="-mx-5 border-b border-gray-200 px-5 pb-4">
          <div className="flex items-center justify-between">
            <img src={logo} alt="Tailormade" className="h-8 w-auto" />
            <span className="h-10 w-10" aria-hidden />
          </div>
        </header>

        <section className="mt-5">
          <h3 className="text-2xl font-semibold leading-tight tracking-tight text-black">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{subtitle}</p>
        </section>

        <section className="mt-8">{children}</section>
      </div>

      {footer ? (
        <div className="fixed left-0 right-0 bottom-6 z-20">
          <div className="max-w-md mx-auto px-5">{footer}</div>
        </div>
      ) : null}
    </div>
  )
}
