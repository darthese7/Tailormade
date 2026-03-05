import { JobStatus } from '@/types/api'

interface JobStatusPillProps {
  status: JobStatus
  compact?: boolean
}

function getStatusLabel(status: JobStatus): string {
  return status === 'delivered' ? 'Delivered' : 'Ongoing'
}

export function JobStatusPill({ status, compact = false }: JobStatusPillProps) {
  const isDelivered = status === 'delivered'

  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium',
        compact ? 'gap-1.5 px-3 py-1.5 text-sm' : 'gap-2 px-4 py-2 text-base',
        isDelivered
          ? 'border border-gray-300 bg-gray-50 text-gray-700'
          : 'border border-amber-300 bg-amber-50/30 text-amber-700',
      ].join(' ')}
    >
      <span
        className={[
          compact ? 'h-1.5 w-1.5 rounded-full' : 'h-2 w-2 rounded-full',
          isDelivered ? 'bg-gray-500' : 'bg-amber-500',
        ].join(' ')}
      />
      {getStatusLabel(status)}
    </span>
  )
}
