import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/layout'
import { Skeleton, useToast } from '@/components/primitives'
import {
  DeliverConfirmModal,
  JobStatusPill,
} from '@/features/jobs/components'
import {
  useJobsQuery,
  useUpdateJobMutation,
  useUpdateJobStatusMutation,
} from '@/features/jobs/jobsHooks'
import { useCustomersQuery } from '@/features/customers/customerHooks'
import { formatCurrency, formatDateLabel } from '@/lib/utils/date'
import { phoneForWhatsapp } from '@/lib/utils/phone'

type MeasurementValueMap = Record<string, string>
type JobDetailDraft = {
  deliveryDate: string
  agreedPrice: string
  measurementValues: MeasurementValueMap
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
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

export function JobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const pushToast = useToast()
  const jobsQuery = useJobsQuery()
  const customersQuery = useCustomersQuery()
  const updateJobStatusMutation = useUpdateJobStatusMutation()
  const updateJobMutation = useUpdateJobMutation()

  const [openConfirmModal, setOpenConfirmModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draftByJobId, setDraftByJobId] = useState<Record<string, JobDetailDraft>>({})

  const job = useMemo(
    () => jobsQuery.data?.find((item) => item.id === jobId),
    [jobId, jobsQuery.data],
  )
  const orderedFields = useMemo(
    () => job?.measurementSnapshot.fields ?? [],
    [job?.measurementSnapshot.fields],
  )
  const defaultValuesByKey = useMemo<MeasurementValueMap>(() => {
    const map: MeasurementValueMap = {}
    orderedFields.forEach((field) => {
      map[field.key] = field.value
    })
    return map
  }, [orderedFields])

  if (!jobId) {
    return <Navigate to="/jobs" replace />
  }

  if (jobsQuery.isLoading || customersQuery.isLoading) {
    return (
      <div>
        <AppHeader />
        <div className="mt-10 space-y-6">
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 gap-8">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`measurement-skeleton-${index}`} className="h-28 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return <p className="text-base text-gray-500">Job not found.</p>
  }

  const customerName =
    job.customerName?.trim() ||
    customersQuery.data?.find((item) => item.id === job.customerId)?.name ||
    'Customer Walk-in'
  const customer = customersQuery.data?.find((item) => item.id === job.customerId)
  const rawPhone = customer?.phone?.trim() ?? ''
  const measurementName = job.measurementSnapshot.templateName?.trim() || 'Measurement'
  const whatsappPhone = rawPhone ? phoneForWhatsapp(rawPhone).replace(/\D/g, '') : ''
  const hasWhatsappPhone =
    whatsappPhone.length >= 13 && whatsappPhone.startsWith('234')
  const whatsappMessage = encodeURIComponent(
    `Hi ${customerName}, quick update on your ${measurementName}.`,
  )
  const whatsappHref = hasWhatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`
    : ''
  const currentDraft =
    draftByJobId[job.id] ?? {
      deliveryDate: job.deliveryDate,
      agreedPrice: String(job.agreedPrice),
      measurementValues: defaultValuesByKey,
    }

  const resetDraftForJob = () => {
    setDraftByJobId((current) => {
      const next = { ...current }
      delete next[job.id]
      return next
    })
  }

  const handleStartEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    resetDraftForJob()
    setIsEditing(false)
  }

  const handleApplyChanges = async () => {
    const agreedPrice = Number(currentDraft.agreedPrice)
    if (!currentDraft.deliveryDate.trim()) {
      pushToast('Delivery date is required.', 'error')
      return
    }
    if (Number.isNaN(agreedPrice) || agreedPrice <= 0) {
      pushToast('Agreed price must be greater than 0.', 'error')
      return
    }

    try {
      const measurementSnapshot = {
        ...job.measurementSnapshot,
        fields: job.measurementSnapshot.fields.map((field) => ({
          ...field,
          value: currentDraft.measurementValues[field.key] ?? '',
        })),
      }

      await updateJobMutation.mutateAsync({
        jobId: job.id,
        payload: {
          deliveryDate: currentDraft.deliveryDate,
          agreedPrice,
          measurementSnapshot,
        },
      })
      resetDraftForJob()
      setIsEditing(false)
      pushToast('Job updated', 'success')
    } catch {
      pushToast('Unable to update job right now.', 'error')
    }
  }

  const onConfirmDelivered = async () => {
    try {
      await updateJobStatusMutation.mutateAsync({ jobId: job.id, status: 'delivered' })
      setOpenConfirmModal(false)
      pushToast('Marked as delivered', 'success')
      navigate('/jobs?tab=delivered', { replace: true })
    } catch {
      pushToast('Unable to mark as delivered right now.', 'error')
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/jobs')
  }

  return (
    <div className="pb-24">
      <AppHeader
        right={
          isEditing ? (
            <span className="text-base font-semibold text-gray-400">Editing</span>
          ) : (
            <button
              type="button"
              onClick={handleStartEdit}
              className="tap-feedback text-base font-semibold text-gray-700"
            >
              Edit
            </button>
          )
        }
      />

      <section className="mt-10">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-semibold tracking-tight leading-tight text-gray-900">
            {customerName}
          </h1>
          <JobStatusPill status={job.status} />
        </div>

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

        <p className="mt-4 text-xl text-gray-600 leading-tight">
          Measurement Name :{' '}
          <span className="font-semibold text-gray-900">{measurementName}</span>
        </p>
      </section>

      <section className="mt-10 grid grid-cols-2 gap-8">
        <div className="border-b border-gray-200 pb-4">
          <p className="text-sm text-gray-500">Delivery date</p>
          {isEditing ? (
            <input
              type="date"
              value={currentDraft.deliveryDate}
              onChange={(event) => {
                const value = event.target.value
                setDraftByJobId((current) => ({
                  ...current,
                  [job.id]: {
                    ...currentDraft,
                    deliveryDate: value,
                  },
                }))
              }}
              className="mt-2 h-12 w-full rounded-xl border border-gray-200 px-3 text-base text-black outline-none focus:ring-4 focus:ring-black/5"
            />
          ) : (
            <p className="mt-2 text-lg font-semibold text-black">
              {formatDateLabel(job.deliveryDate)}
            </p>
          )}
        </div>

        <div className="border-b border-gray-200 pb-4 text-right">
          <p className="text-sm text-gray-500">Agreed price</p>
          {isEditing ? (
            <div className="mt-2 relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-medium text-gray-700">
                {'\u20A6'}
              </span>
              <input
                inputMode="decimal"
                value={currentDraft.agreedPrice}
                onChange={(event) => {
                  const value = event.target.value
                  setDraftByJobId((current) => ({
                    ...current,
                    [job.id]: {
                      ...currentDraft,
                      agreedPrice: value,
                    },
                  }))
                }}
                className="h-12 w-full rounded-xl border border-gray-200 pl-8 pr-3 text-base text-black outline-none focus:ring-4 focus:ring-black/5"
              />
            </div>
          ) : (
            <p className="mt-2 text-lg font-semibold text-black">
              {formatCurrency(job.agreedPrice)}
            </p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-black">Measurement ( Inches )</h2>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {orderedFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{field.label}</p>
              <div className="relative">
                <input
                  value={currentDraft.measurementValues[field.key] ?? ''}
                  readOnly={!isEditing}
                  onChange={(event) => {
                    if (!isEditing) {
                      return
                    }
                    setDraftByJobId((current) => ({
                      ...current,
                      [job.id]: {
                        ...(current[job.id] ?? currentDraft),
                        measurementValues: {
                          ...((current[job.id]?.measurementValues ?? currentDraft.measurementValues)),
                          [field.key]: event.target.value,
                        },
                      },
                    }))
                  }}
                  className="h-14 w-full rounded-xl border border-gray-200 px-4 pr-12 text-lg text-gray-900 outline-none focus:ring-4 focus:ring-black/5 read-only:bg-white"
                />
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => {
                    setDraftByJobId((current) => ({
                      ...current,
                      [job.id]: {
                        ...(current[job.id] ?? currentDraft),
                        measurementValues: {
                          ...((current[job.id]?.measurementValues ?? currentDraft.measurementValues)),
                          [field.key]: '',
                        },
                      },
                    }))
                  }}
                  className="tap-feedback absolute inset-y-0 right-3 inline-flex h-10 w-10 my-auto items-center justify-center rounded-lg text-black disabled:opacity-40"
                  aria-label={`Clear ${field.label}`}
                >
                  <Trash2 size={22} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isEditing ? (
        <div className="fixed left-0 right-0 bottom-24 z-20">
          <div className="max-w-md mx-auto px-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={updateJobMutation.isPending}
              className="tap-feedback h-14 rounded-xl border border-gray-200 bg-white text-base font-semibold text-gray-900 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleApplyChanges()}
              disabled={updateJobMutation.isPending}
              className="tap-feedback h-14 rounded-xl bg-black text-base font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {updateJobMutation.isPending ? 'Saving...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      ) : job.status !== 'delivered' ? (
        <div className="fixed left-0 right-0 bottom-24 z-20">
          <div className="max-w-md mx-auto px-5 grid grid-cols-[1fr_2fr] gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={updateJobStatusMutation.isPending}
              className="tap-feedback h-14 rounded-xl border border-gray-200 bg-white text-base font-semibold text-gray-900 disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setOpenConfirmModal(true)}
              disabled={updateJobStatusMutation.isPending}
              className="tap-feedback h-14 rounded-xl bg-black text-base font-semibold text-white shadow-sm disabled:opacity-60"
            >
              Mark As Delivered
            </button>
          </div>
        </div>
      ) : null}

      <DeliverConfirmModal
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        onConfirm={() => void onConfirmDelivered()}
        isSubmitting={updateJobStatusMutation.isPending}
      />
    </div>
  )
}
