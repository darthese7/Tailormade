import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/layout'
import { Skeleton } from '@/components/primitives'
import { useCustomersQuery } from '@/features/customers/customerHooks'
import { JobCard } from '@/features/jobs/components'
import { useJobsQuery } from '@/features/jobs/jobsHooks'
import { phoneForWhatsapp } from '@/lib/utils/phone'

type ProfileTab = 'active' | 'past'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M20.52 3.48A11.94 11.94 0 0 0 12.04 0C5.42 0 .04 5.38.04 12c0 2.12.56 4.2 1.62 6.03L0 24l6.15-1.61A11.9 11.9 0 0 0 12.04 24h.01c6.62 0 12-5.38 12-12 0-3.2-1.25-6.2-3.53-8.52ZM12.05 21.96h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.65.96.97-3.56-.23-.37A9.94 9.94 0 0 1 2.04 12C2.04 6.49 6.53 2 12.04 2c2.66 0 5.16 1.03 7.03 2.91A9.87 9.87 0 0 1 22.04 12c0 5.51-4.49 9.96-9.99 9.96Z"
        fill="currentColor"
      />
      <path
        d="M17.52 14.57c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.37-1.46-.87-.78-1.46-1.75-1.63-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.12 3.25 5.13 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-700">
      {count}
    </span>
  )
}

export function CustomerProfilePage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<ProfileTab>('active')

  const customersQuery = useCustomersQuery()
  const jobsQuery = useJobsQuery()

  if (!customerId) {
    return <Navigate to="/customers" replace />
  }

  if (customersQuery.isLoading || jobsQuery.isLoading) {
    return (
      <div>
        <AppHeader />
        <div className="mt-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-44" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`customer-profile-skeleton-${index}`} className="rounded-2xl border border-gray-200 p-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-4 h-5 w-32" />
              <Skeleton className="mt-6 h-14 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const customer = customersQuery.data?.find((item) => item.id === customerId)
  if (!customer) {
    return <p className="text-base text-gray-500">Customer not found.</p>
  }

  const customerJobs = (jobsQuery.data ?? []).filter((job) => job.customerId === customerId)
  const activeJobs = customerJobs.filter((job) => job.status !== 'delivered')
  const pastJobs = customerJobs.filter((job) => job.status === 'delivered')
  const jobs = tab === 'active' ? activeJobs : pastJobs
  const whatsappPhone = phoneForWhatsapp(customer.phone).replace(/\D/g, '')
  const hasWhatsappPhone = whatsappPhone.length >= 13 && whatsappPhone.startsWith('234')
  const whatsappMessage = encodeURIComponent(
    `Hi ${customer.name}, quick update on your measurements.`,
  )
  const whatsappHref = hasWhatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`
    : ''

  return (
    <div className="pb-24">
      <AppHeader />

      <section className="mt-8">
        <h1 className="text-4xl font-semibold tracking-tight leading-tight text-black">
          {customer.name}
        </h1>
        <p className="mt-2 text-base text-gray-500 leading-relaxed">{customer.phone}</p>
        {hasWhatsappPhone ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
            Chat on WhatsApp
          </a>
        ) : (
          <div className="mt-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400">
              <WhatsAppIcon className="h-4 w-4 text-gray-400" />
              Chat on WhatsApp
            </span>
            <p className="mt-1 text-xs text-gray-500">No phone number</p>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={[
              'tap-feedback h-12 rounded-xl text-lg font-semibold',
              tab === 'active' ? 'bg-black text-white' : 'bg-transparent text-gray-500',
            ].join(' ')}
          >
            <span className="inline-flex items-center gap-2">
              Active Jobs
              <CountBadge count={activeJobs.length} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('past')}
            className={[
              'tap-feedback h-12 rounded-xl text-lg font-semibold',
              tab === 'past' ? 'bg-black text-white' : 'bg-transparent text-gray-500',
            ].join(' ')}
          >
            <span className="inline-flex items-center gap-2">
              Past Jobs
              <CountBadge count={pastJobs.length} />
            </span>
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="min-h-[24vh] flex items-center justify-center">
            <p className="text-lg font-semibold text-gray-700">No jobs currently</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                customerName={customer.name}
                measurementName={job.measurementSnapshot.templateName?.trim() || 'Measurement'}
                title={job.measurementSnapshot.templateName?.trim() || 'Measurement'}
                showMeasurementLine={false}
              />
            ))}
          </div>
        )}
      </section>

      <div className="fixed left-0 right-0 bottom-24 z-20">
        <div className="max-w-md mx-auto px-5">
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1)
                  return
                }
                navigate('/customers')
              }}
              className="tap-feedback inline-flex h-14 items-center justify-center rounded-xl border border-gray-200 bg-white text-base font-semibold text-gray-900"
            >
              Back
            </button>
            <Link
              to={`/jobs/new?customerId=${customer.id}`}
              className="tap-feedback inline-flex h-14 items-center justify-center rounded-xl bg-black text-lg font-semibold text-white shadow-sm"
            >
              Take Measurement
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
