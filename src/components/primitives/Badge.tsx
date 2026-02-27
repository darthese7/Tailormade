import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'default' | 'warning' | 'success' | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-text',
  warning: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  danger: 'bg-error/15 text-error',
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        badgeStyles[variant],
        className,
      )}
      {...props}
    />
  )
}

