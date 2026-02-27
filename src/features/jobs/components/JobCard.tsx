import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Job } from '@/types/api'
import { formatCurrency, formatDayMonth } from '@/lib/utils/date'
import { JobStatusPill } from '@/features/jobs/components/JobStatusPill'

interface JobCardProps {
  job: Job
  customerName: string
  measurementName: string
  title?: string
  showMeasurementLine?: boolean
}

export function JobCard({
  job,
  customerName,
  measurementName,
  title,
  showMeasurementLine = true,
}: JobCardProps) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="tap-feedback block overflow-hidden rounded-2xl border border-gray-200 bg-white"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-2xl font-semibold tracking-tight text-gray-900 leading-tight">
            {title ?? customerName}
          </h3>
          <JobStatusPill status={job.status} />
        </div>

        {showMeasurementLine ? (
          <p className="mt-4 text-base text-gray-600 leading-tight">
            Measurement Name :{' '}
            <span className="font-semibold text-gray-900">{measurementName}</span>
          </p>
        ) : null}

        <div
          className={[
            'flex items-end justify-between gap-4',
            showMeasurementLine ? 'mt-6' : 'mt-6',
          ].join(' ')}
        >
          <p className="text-base text-gray-600 leading-tight">
            Delivery :{' '}
            <span className="font-semibold text-gray-900">{formatDayMonth(job.deliveryDate)}</span>
          </p>
          <p className="text-lg font-semibold text-gray-900 leading-tight">
            {formatCurrency(job.agreedPrice)}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 p-5">
        <span className="inline-flex items-center gap-2 text-xl font-semibold text-gray-900 leading-tight">
          View Details
          <ArrowUpRight size={20} />
        </span>
      </div>
    </Link>
  )
}
