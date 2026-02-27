import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/80 bg-white p-4 shadow-card',
        className,
      )}
      {...props}
    />
  )
}
