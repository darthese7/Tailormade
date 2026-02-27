import { JobStatus } from '@/types/api'

interface JobStatusPillProps {
  status: JobStatus
}

function getStatusLabel(status: JobStatus): string {
  return status === 'delivered' ? 'Delivered' : 'Ongoing'
}

export function JobStatusPill({ status }: JobStatusPillProps) {
  const isDelivered = status === 'delivered'

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium',
        isDelivered
          ? 'border border-gray-300 bg-gray-50 text-gray-700'
          : 'border border-amber-300 bg-amber-50/30 text-amber-700',
      ].join(' ')}
    >
      <span
        className={[
          'h-2 w-2 rounded-full',
          isDelivered ? 'bg-gray-500' : 'bg-amber-500',
        ].join(' ')}
      />
      {getStatusLabel(status)}
    </span>
  )
}

