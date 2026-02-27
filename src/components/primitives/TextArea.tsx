import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, hint, error, className, ...props }, ref) => (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
      ) : null}
      <textarea
        ref={ref}
        className={cn(
          'min-h-28 w-full rounded-xl border-border bg-white px-3 py-2 text-base text-text shadow-sm transition placeholder:text-muted focus:border-black focus:ring-black/20',
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

TextArea.displayName = 'TextArea'
