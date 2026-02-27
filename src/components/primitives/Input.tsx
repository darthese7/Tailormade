import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
      ) : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border-border bg-white px-3 text-base text-text shadow-sm transition placeholder:text-muted focus:border-black focus:ring-black/20',
          className,
        )}
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-xs text-error">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  ),
)

Input.displayName = 'Input'
