import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '@/components/layout'
import { Skeleton } from '@/components/primitives'
import { useCustomersQuery } from '@/features/customers/customerHooks'
import {
  JobCard,
  JobsTabs,
} from '@/features/jobs/components'
import { useJobsQuery } from '@/features/jobs/jobsHooks'

type JobsTab = 'ongoing' | 'delivered'

function pickMeasurementName(templateName?: string): string {
  return templateName?.trim() || 'Measurement'
}

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const jobsQuery = useJobsQuery()
  const customersQuery = useCustomersQuery()
  const [search, setSearch] = useState('')
  const activeTab: JobsTab =
    searchParams.get('tab') === 'delivered' ? 'delivered' : 'ongoing'

  const customersById = useMemo(() => {
    const map = new Map<string, string>()
    ;(customersQuery.data ?? []).forEach((customer) => {
      map.set(customer.id, customer.name)
    })
    return map
  }, [customersQuery.data])

  const jobs = jobsQuery.data ?? []
  const ongoingJobs = jobs.filter((job) => job.status !== 'delivered')
  const deliveredJobs = jobs.filter((job) => job.status === 'delivered')
  const ongoingCount = ongoingJobs.length
  const deliveredCount = deliveredJobs.length

  const displayedJobs = activeTab === 'ongoing' ? ongoingJobs : deliveredJobs

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return displayedJobs
    }

    return displayedJobs.filter((job) => {
      const customerName =
        job.customerName?.trim() || customersById.get(job.customerId) || 'Customer Walk-in'
      const measurementName = pickMeasurementName(job.measurementSnapshot.templateName)

      return (
        customerName.toLowerCase().includes(query) ||
        measurementName.toLowerCase().includes(query)
      )
    })
  }, [customersById, displayedJobs, search])

  const handleTabChange = (tab: JobsTab) => {
    if (tab === 'delivered') {
      setSearchParams({ tab: 'delivered' }, { replace: true })
      return
    }
    setSearchParams({}, { replace: true })
  }

  return (
    <div>
      <AppHeader />

      <section className="mt-8">
        <h1 className="text-4xl font-semibold tracking-tight leading-tight text-black">Jobs</h1>
        <p className="mt-2 text-base text-gray-500 leading-relaxed">
          Keep track of what&apos;s due and what&apos;s done.
        </p>
      </section>

      <JobsTabs
        activeTab={activeTab}
        ongoingCount={ongoingCount}
        deliveredCount={deliveredCount}
        onChange={handleTabChange}
      />

      <div className="relative mt-6">
        <Search
          size={24}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search Jobs"
          className="w-full h-12 rounded-xl border border-gray-200 pl-12 pr-4 text-base text-gray-700 placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-black/5"
        />
      </div>

      {jobsQuery.isLoading ? (
        <div className="mt-6 space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={`job-skeleton-${index}`} className="rounded-2xl border border-gray-200 p-6">
              <Skeleton className="h-10 w-56" />
              <Skeleton className="mt-4 h-8 w-72" />
              <div className="mt-6 flex justify-between">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="mt-6 h-16 w-full" />
            </div>
          ))}
        </div>
      ) : null}

      {jobsQuery.isError ? (
        <p className="mt-10 text-base font-medium text-error">Unable to load jobs.</p>
      ) : null}

      {!jobsQuery.isLoading && !jobsQuery.isError ? (
        filteredJobs.length === 0 ? (
          <div className="min-h-[45vh] flex items-center justify-center">
            <p className="text-xl font-semibold text-gray-700">No jobs currently</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {filteredJobs.map((job) => {
              const customerName =
                job.customerName?.trim() ||
                customersById.get(job.customerId) ||
                'Customer Walk-in'
              const measurementName = pickMeasurementName(
                job.measurementSnapshot.templateName,
              )

              return (
                <JobCard
                  key={job.id}
                  job={job}
                  customerName={customerName}
                  measurementName={measurementName}
                />
              )
            })}
          </div>
        )
      ) : null}
    </div>
  )
}
