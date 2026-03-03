import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  endAdornment?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, endAdornment, ...props }, ref) => (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
      ) : null}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border-border bg-white px-3 text-base text-text shadow-sm transition placeholder:text-muted focus:border-black focus:ring-black/20',
            endAdornment ? 'pr-12' : null,
            className,
          )}
          {...props}
        />
        {endAdornment ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {endAdornment}
          </div>
        ) : null}
      </div>
      {error ? (
        <span className="mt-1 block text-xs text-error">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  ),
)

Input.displayName = 'Input'
