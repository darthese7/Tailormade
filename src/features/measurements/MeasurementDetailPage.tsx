import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/layout'
import { Button, Input, Skeleton, useToast } from '@/components/primitives'
import {
  useMeasurementRecordsQuery,
  useUpdateMeasurementMutation,
} from '@/features/measurements/measurementHooks'
import { MeasurementRecord } from '@/types/api'

type PartDraft = {
  id: string
  label: string
  value: string
  unit: 'inches'
}

function normalizePartLabel(value: string): string {
  return value.trim().toLowerCase()
}

function createDraftParts(measurement: MeasurementRecord): PartDraft[] {
  return measurement.parts.map((part, index) => ({
    id: `${measurement.id}-${index}-${part.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    label: part.label,
    value: String(part.value),
    unit: 'inches',
  }))
}

function createPart(label: string): PartDraft {
  return {
    id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    value: '',
    unit: 'inches',
  }
}

function MeasurementDetailForm({
  customerId,
  measurement,
}: {
  customerId: string
  measurement: MeasurementRecord
}) {
  const navigate = useNavigate()
  const pushToast = useToast()
  const updateMeasurementMutation = useUpdateMeasurementMutation()
  const [isEditing, setIsEditing] = useState(false)
  const [measurementName, setMeasurementName] = useState(measurement.measurementName)
  const [parts, setParts] = useState<PartDraft[]>(createDraftParts(measurement))
  const [error, setError] = useState('')
  const [partErrors, setPartErrors] = useState<Record<string, string>>({})

  const resetDraft = () => {
    setMeasurementName(measurement.measurementName)
    setParts(createDraftParts(measurement))
    setError('')
    setPartErrors({})
  }

  const startEdit = () => {
    resetDraft()
    setIsEditing(true)
  }

  const cancelEdit = () => {
    resetDraft()
    setIsEditing(false)
  }

  const updatePartValue = (partId: string, nextValue: string) => {
    setParts((current) =>
      current.map((part) => (part.id === partId ? { ...part, value: nextValue } : part)),
    )
    setPartErrors((current) => {
      if (!current[partId]) {
        return current
      }
      const next = { ...current }
      delete next[partId]
      return next
    })
    setError('')
  }

  const addPart = () => {
    const input = window.prompt('Enter measurement part name')
    if (input === null) {
      return
    }

    const label = input.trim()
    if (!label) {
      setError('Part name is required.')
      return
    }

    const exists = parts.some(
      (part) => normalizePartLabel(part.label) === normalizePartLabel(label),
    )
    if (exists) {
      setError('Part name already exists.')
      return
    }

    setParts((current) => [...current, createPart(label)])
    setError('')
  }

  const removePart = (partId: string) => {
    setParts((current) => current.filter((part) => part.id !== partId))
    setPartErrors((current) => {
      if (!current[partId]) {
        return current
      }
      const next = { ...current }
      delete next[partId]
      return next
    })
  }

  const handleSave = async () => {
    const trimmedName = measurementName.trim()
    if (trimmedName.length < 2) {
      setError('Measurement name is required.')
      return
    }

    const nextPartErrors: Record<string, string> = {}
    const normalizedParts: Array<{ label: string; value: number; unit: 'inches' }> = []

    parts.forEach((part) => {
      const label = part.label.trim()
      const numericValue = Number(part.value)

      if (!label) {
        nextPartErrors[part.id] = 'Label is required'
        return
      }
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        nextPartErrors[part.id] = 'Value must be greater than 0'
        return
      }

      normalizedParts.push({
        label,
        value: numericValue,
        unit: 'inches',
      })
    })

    setPartErrors(nextPartErrors)
    if (Object.keys(nextPartErrors).length > 0) {
      return
    }

    if (normalizedParts.length === 0) {
      setError('Add at least one measurement value greater than 0.')
      return
    }

    try {
      await updateMeasurementMutation.mutateAsync({
        measurementId: measurement.id,
        customerId,
        payload: {
          measurementName: trimmedName,
          parts: normalizedParts,
          inspirationPhotos: measurement.inspirationPhotos ?? [],
          fabricPhotos: measurement.fabricPhotos ?? [],
        },
      })

      setIsEditing(false)
      setMeasurementName(trimmedName)
      setParts(
        normalizedParts.map((part, index) => ({
          id: `${measurement.id}-${index}-${part.label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')}`,
          label: part.label,
          value: String(part.value),
          unit: 'inches',
        })),
      )
      setError('')
      setPartErrors({})
      pushToast('Measurement updated', 'success')
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to update measurement.',
      )
    }
  }

  const handleBackToProfile = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(`/customers/${customerId}?tab=measurements&measurementId=${measurement.id}`, {
      replace: true,
    })
  }

  return (
    <>
      <section className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight leading-tight text-black">
          {measurementName.trim() || measurement.measurementName}
        </h1>
        <p className="mt-2 text-base text-gray-500">Update measurement values</p>
      </section>

      <div className="mt-8 space-y-6">
        <Input
          label="Measurement Name"
          value={measurementName}
          readOnly={!isEditing}
          onChange={(event) => {
            if (!isEditing) {
              return
            }
            setMeasurementName(event.target.value)
            setError('')
          }}
          className="h-12 read-only:bg-white"
        />

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-black">Measurement ( Inches )</h2>
          <div className="grid grid-cols-2 gap-4">
            {parts.map((part) => (
              <div key={part.id} className="space-y-2">
                <p className="text-sm font-semibold text-gray-800">{part.label}</p>

                <div className="relative">
                  <input
                    value={part.value}
                    readOnly={!isEditing}
                    onChange={(event) => updatePartValue(part.id, event.target.value)}
                    inputMode="decimal"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 pr-11 text-base text-gray-700 focus:border-black focus:ring-black/20 read-only:bg-white"
                  />
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => removePart(part.id)}
                      className="tap-feedback absolute inset-y-0 right-3 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-black"
                      aria-label={`Delete ${part.label || 'measurement part'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>

                {partErrors[part.id] ? (
                  <p className="text-xs text-error">{partErrors[part.id]}</p>
                ) : null}
              </div>
            ))}
          </div>

          {isEditing ? (
            <button
              type="button"
              onClick={addPart}
              className="tap-feedback inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-base font-semibold text-gray-900"
            >
              <Plus size={20} />
              Add measurement
            </button>
          ) : null}
        </section>

        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>

      {isEditing ? (
        <div className="fixed left-0 right-0 bottom-24 z-20">
          <div className="max-w-md mx-auto px-5 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              className="h-14 text-base"
              onClick={cancelEdit}
              disabled={updateMeasurementMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-14 bg-black text-base text-white hover:bg-black/95"
              onClick={() => void handleSave()}
              disabled={updateMeasurementMutation.isPending}
            >
              {updateMeasurementMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="fixed left-0 right-0 bottom-24 z-20">
          <div className="max-w-md mx-auto px-5 grid grid-cols-[1fr_2fr] gap-3">
            <Button
              type="button"
              variant="secondary"
              className="h-14 text-base"
              onClick={handleBackToProfile}
            >
              Back
            </Button>
            <Button
              type="button"
              className="h-14 bg-black text-base text-white hover:bg-black/95"
              onClick={startEdit}
            >
              Edit
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

export function MeasurementDetailPage() {
  const { customerId, measurementId } = useParams()
  const measurementsQuery = useMeasurementRecordsQuery(customerId)

  if (!customerId || !measurementId) {
    return <Navigate to="/customers" replace />
  }

  if (measurementsQuery.isLoading) {
    return (
      <div>
        <AppHeader />
        <div className="mt-8 space-y-6">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`measurement-field-${index}`} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (measurementsQuery.isError) {
    return <p className="mt-8 text-base font-medium text-error">Unable to load measurement.</p>
  }

  const measurement = measurementsQuery.data?.find((item) => item.id === measurementId)
  if (!measurement) {
    return <p className="mt-8 text-base text-gray-500">Measurement not found.</p>
  }

  return (
    <div className="pb-24">
      <AppHeader />
      <MeasurementDetailForm
        key={measurement.id}
        customerId={customerId}
        measurement={measurement}
      />
    </div>
  )
}
