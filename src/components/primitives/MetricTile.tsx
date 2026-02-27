import { type LucideIcon } from 'lucide-react'
import { Card } from '@/components/primitives/Card'
import { cn } from '@/lib/utils/cn'

interface MetricTileProps {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: 'default' | 'error' | 'success'
}

export function MetricTile({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: MetricTileProps) {
  return (
    <Card className="space-y-2 p-3.5">
      <div className="flex items-center justify-between">
        <p className="secondary-text text-xs">{label}</p>
        <span
          className={cn(
            'rounded-xl border border-border/70 p-1.5',
            tone === 'error' && 'bg-error/10 text-error',
            tone === 'success' && 'bg-success/10 text-success',
          )}
        >
          <Icon size={16} />
        </span>
      </div>
      <p
        className={cn(
          'metric-value text-2xl',
          tone === 'error' && 'text-error',
          tone === 'success' && 'text-success',
        )}
      >
        {value}
      </p>
    </Card>
  )
}

