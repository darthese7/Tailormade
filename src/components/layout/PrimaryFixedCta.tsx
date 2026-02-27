import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type PrimaryFixedCtaProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
}

export function PrimaryFixedCta({
  label,
  className,
  type = 'button',
  ...props
}: PrimaryFixedCtaProps) {
  return (
    <div className="fixed left-0 right-0 bottom-24 z-20">
      <div className="max-w-md mx-auto px-5">
        <button
          type={type}
          className={cn(
            'tap-feedback h-14 w-full rounded-xl bg-black text-lg font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60',
            className,
          )}
          {...props}
        >
          {label}
        </button>
      </div>
    </div>
  )
}

