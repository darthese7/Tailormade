import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'destructive'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary/30',
  secondary:
    'border border-border bg-white text-text hover:bg-gray-50 focus-visible:ring-border',
  destructive:
    'bg-error text-white hover:bg-error/90 focus-visible:ring-error/30',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', fullWidth, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'tap-feedback inline-flex h-12 min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2',
        variantStyles[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  ),
)

Button.displayName = 'Button'
