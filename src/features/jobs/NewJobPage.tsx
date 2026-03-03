import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Upload, UserRound } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logo from '@/assets/logo.svg'
import { Button, Input, useToast } from '@/components/primitives'
import {
  useCustomersQuery,
  useUpsertCustomerMutation,
} from '@/features/customers/customerHooks'
import {
  useCreateJobFromMeasurementMutation,
  useCreateMeasurementMutation,
} from '@/features/measurements/measurementHooks'
import {
  takeMeasurementSchema,
  type TakeMeasurementInput,
} from '@/features/measurements/schemas'
import { useDraft } from '@/features/offline/useDraft'
import { STORAGE_KEYS } from '@/lib/storage/keys'

interface MeasurementRow {
  id: string
  label: string
  value: string
  unit: 'inches'
}

interface TakeMeasurementDraft {
  customerName: string
  customerPhone: string
  measurementName: string
  deliveryDate: string
  agreedPrice: string
  inspirationPhotos: string[]
  fabricPhotos: string[]
  rows: MeasurementRow[]
  selectedCustomerId: string | null
}

const DEFAULT_ROWS = ['Bust', 'Waist', 'Hip', 'Length']

function createRow(label = ''): MeasurementRow {
  return {
    id: `part_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label,
    value: '',
    unit: 'inches',
  }
}

function createDefaultRows(): MeasurementRow[] {
  return DEFAULT_ROWS.map((label) => createRow(label))
}

function normalizeDraftRows(rows: MeasurementRow[]): MeasurementRow[] {
  return rows.map((row) => ({
    ...row,
    value: row.value === '0' ? '' : row.value,
  }))
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

function createDefaultDraft(): TakeMeasurementDraft {
  return {
    customerName: '',
    customerPhone: '',
    measurementName: '',
    deliveryDate: '',
    agreedPrice: '',
    inspirationPhotos: [],
    fabricPhotos: [],
    rows: createDefaultRows(),
    selectedCustomerId: null,
  }
}

function createDefaultFormValues(): TakeMeasurementInput {
  return {
    customerName: '',
    customerPhone: '',
    measurementName: '',
    deliveryDate: '',
    agreedPrice: '',
  }
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}

export function NewJobPage() {
  const [searchParams] = useSearchParams()
  const preselectedCustomerId = searchParams.get('customerId') ?? ''
  const navigate = useNavigate()
  const pushToast = useToast()
  const customersQuery = useCustomersQuery()
  const upsertCustomerMutation = useUpsertCustomerMutation()
  const createMeasurementMutation = useCreateMeasurementMutation()
  const createJobFromMeasurementMutation = useCreateJobFromMeasurementMutation()

  const initialDraft = useMemo(() => createDefaultDraft(), [])
  const { draft, setDraft, discardDraft } = useDraft(
    STORAGE_KEYS.takeMeasurementDraft,
    initialDraft,
  )

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<TakeMeasurementInput>({
    resolver: zodResolver(takeMeasurementSchema),
    defaultValues: {
      customerName: draft.customerName,
      customerPhone: draft.customerPhone,
      measurementName: draft.measurementName,
      deliveryDate: draft.deliveryDate,
      agreedPrice: draft.agreedPrice,
    },
  })

  const [rows, setRows] = useState<MeasurementRow[]>(
    draft.rows.length > 0 ? normalizeDraftRows(draft.rows) : createDefaultRows(),
  )
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [partsError, setPartsError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    (draft.selectedCustomerId ?? preselectedCustomerId) || null,
  )
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [autoFocusRowId, setAutoFocusRowId] = useState<string | null>(null)
  const [isAddingPart, setIsAddingPart] = useState(false)
  const [newPartLabel, setNewPartLabel] = useState('')
  const [newPartError, setNewPartError] = useState('')
  const [inspirationPhotos, setInspirationPhotos] = useState<string[]>(
    draft.inspirationPhotos,
  )
  const [fabricPhotos, setFabricPhotos] = useState<string[]>(draft.fabricPhotos)

  const [customerName = '', customerPhone = '', measurementName = '', deliveryDate = '', agreedPrice = ''] =
    useWatch({
      control,
      name: [
        'customerName',
        'customerPhone',
        'measurementName',
        'deliveryDate',
        'agreedPrice',
      ],
    })

  useEffect(() => {
    setDraft({
      customerName,
      customerPhone,
      measurementName,
      deliveryDate,
      agreedPrice,
      inspirationPhotos,
      fabricPhotos,
      rows,
      selectedCustomerId,
    })
  }, [
    agreedPrice,
    customerName,
    customerPhone,
    deliveryDate,
    fabricPhotos,
    inspirationPhotos,
    measurementName,
    rows,
    selectedCustomerId,
    setDraft,
  ])

  const customers = useMemo(() => customersQuery.data ?? [], [customersQuery.data])

  useEffect(() => {
    if (!selectedCustomerId || customers.length === 0) {
      return
    }

    const customer = customers.find((item) => item.id === selectedCustomerId)
    if (!customer) {
      return
    }

    if (customerName && customerPhone) {
      return
    }

    setValue('customerName', customer.name, { shouldValidate: true })
    setValue('customerPhone', customer.phone, { shouldValidate: true })
  }, [customerName, customerPhone, customers, selectedCustomerId, setValue])

  const debouncedName = useDebouncedValue(customerName, 250)

  const suggestions = useMemo(() => {
    const query = debouncedName.trim().toLowerCase()
    if (!query || selectedCustomerId) {
      return []
    }

    return customers
      .filter((customer) => customer.name.toLowerCase().includes(query))
      .slice(0, 5)
  }, [customers, debouncedName, selectedCustomerId])

  const exactNameMatch = useMemo(() => {
    if (!customerName.trim()) {
      return null
    }

    return (
      customers.find(
        (customer) => normalizeName(customer.name) === normalizeName(customerName),
      ) ?? null
    )
  }, [customerName, customers])

  const duplicateNameError =
    !selectedCustomerId && exactNameMatch
      ? 'Customer name already exists. Select from list.'
      : ''

  const isSaving =
    upsertCustomerMutation.isPending ||
    createMeasurementMutation.isPending ||
    createJobFromMeasurementMutation.isPending
  const customerNameField = register('customerName')

  const applyExistingCustomer = (customerId: string) => {
    const customer = customers.find((item) => item.id === customerId)
    if (!customer) {
      return
    }

    setSelectedCustomerId(customer.id)
    setValue('customerName', customer.name, { shouldValidate: true })
    setValue('customerPhone', customer.phone, { shouldValidate: true })
    setShowSuggestions(false)
    setSaveError('')
  }

  const clearSelectedCustomer = () => {
    setSelectedCustomerId(null)
    setValue('customerName', '', { shouldValidate: true })
    setValue('customerPhone', '', { shouldValidate: true })
  }

  const removeInspirationPhoto = (indexToRemove: number) => {
    setInspirationPhotos((current) =>
      current.filter((_, index) => index !== indexToRemove),
    )
  }

  const removeFabricPhoto = (indexToRemove: number) => {
    setFabricPhotos((current) => current.filter((_, index) => index !== indexToRemove))
  }

  const appendInspirationPhotos = (files: File[]) => {
    const nextUrls = files.map((file) => URL.createObjectURL(file))
    setInspirationPhotos((current) => [...current, ...nextUrls])
  }

  const appendFabricPhotos = (files: File[]) => {
    const nextUrls = files.map((file) => URL.createObjectURL(file))
    setFabricPhotos((current) => [...current, ...nextUrls])
  }

  const addMeasurementRow = () => {
    setIsAddingPart(true)
    setNewPartLabel('')
    setNewPartError('')
  }

  const confirmAddMeasurementRow = () => {
    const label = newPartLabel.trim()
    if (!label) {
      setNewPartError('Part name is required')
      return
    }

    const exists = rows.some((row) => normalizeName(row.label) === normalizeName(label))
    if (exists) {
      setNewPartError('Part name already exists')
      return
    }

    const row = createRow(label)
    setRows((current) => [...current, row])
    setAutoFocusRowId(row.id)
    setIsAddingPart(false)
    setNewPartLabel('')
    setNewPartError('')
  }

  const cancelAddMeasurementRow = () => {
    setIsAddingPart(false)
    setNewPartLabel('')
    setNewPartError('')
  }

  const removeMeasurementRow = (rowId: string) => {
    setRows((current) => current.filter((item) => item.id !== rowId))
    setRowErrors((current) => {
      const next = { ...current }
      delete next[rowId]
      return next
    })
  }

  const updateRowValue = (rowId: string, value: string) => {
    setRows((current) =>
      current.map((item) => (item.id === rowId ? { ...item, value } : item)),
    )
    setRowErrors((current) => {
      if (!current[rowId]) {
        return current
      }
      const next = { ...current }
      delete next[rowId]
      return next
    })
    setPartsError('')
  }

  const onSubmit = handleSubmit(async (values) => {
    setSaveError('')

    if (duplicateNameError) {
      return
    }

    const nextRowErrors: Record<string, string> = {}
    const validParts: Array<{ label: string; value: number; unit: 'inches' }> = []

    rows.forEach((row) => {
      const label = row.label.trim()
      const parsedValue = Number(row.value)

      if (!label) {
        nextRowErrors[row.id] = 'Part label is required'
        return
      }

      if (Number.isNaN(parsedValue)) {
        nextRowErrors[row.id] = 'Enter a valid number'
        return
      }

      if (parsedValue < 0) {
        nextRowErrors[row.id] = 'Value must be zero or greater'
        return
      }

      if (parsedValue > 0) {
        validParts.push({
          label,
          value: parsedValue,
          unit: 'inches',
        })
      }
    })

    setRowErrors(nextRowErrors)
    if (Object.keys(nextRowErrors).length > 0) {
      return
    }

    if (validParts.length === 0) {
      setPartsError('Add at least one measurement value greater than 0.')
      return
    }

    let customerId = selectedCustomerId

    pushToast('Saving measurement...', 'info')

    try {
      const upsertedCustomer = await upsertCustomerMutation.mutateAsync({
        name: values.customerName,
        phone: values.customerPhone,
        notes: '',
      })
      customerId = upsertedCustomer.id
      setSelectedCustomerId(upsertedCustomer.id)
      setValue('customerName', upsertedCustomer.name, { shouldValidate: true })
      setValue('customerPhone', upsertedCustomer.phone, { shouldValidate: true })

      if (!customerId) {
        setSaveError('Could not resolve customer. Please try again.')
        return
      }

      const measurementRecord = await createMeasurementMutation.mutateAsync({
        customerId,
        payload: {
          measurementName: values.measurementName,
          parts: validParts,
          inspirationPhotos,
          fabricPhotos,
        },
      })

      const hasDeliveryDate = Boolean(values.deliveryDate?.trim())
      const hasAgreedPrice = Boolean(values.agreedPrice?.trim())

      if (!(hasDeliveryDate && hasAgreedPrice)) {
        discardDraft()
        reset(createDefaultFormValues())
        setRows(createDefaultRows())
        setInspirationPhotos([])
        setFabricPhotos([])
        setSelectedCustomerId(null)

        pushToast('Measurement saved', 'success')
        navigate(
          `/customers/${customerId}?tab=measurements&measurementId=${measurementRecord.id}`,
        )
        return
      }

      const job = await createJobFromMeasurementMutation.mutateAsync({
        measurementId: measurementRecord.id,
        customerId,
        measurementName: measurementRecord.measurementName,
        parts: measurementRecord.parts,
        payload: {
          deliveryDate: values.deliveryDate ?? '',
          agreedPrice: Number(values.agreedPrice),
          status: 'ongoing',
        },
      })

      discardDraft()
      reset(createDefaultFormValues())
      setRows(createDefaultRows())
      setInspirationPhotos([])
      setFabricPhotos([])
      setSelectedCustomerId(null)

      if (job.id.startsWith('offline-job-')) {
        pushToast('Job queued for sync while offline.', 'info')
        navigate('/jobs')
      } else {
        pushToast('Job created', 'success')
        navigate(`/jobs/${job.id}`)
      }
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Could not save measurement now. Please try again.',
      )
    }
  })

  return (
    <div className="pb-44">
      <header className="-mx-5 border-b border-gray-200 px-5 pb-4">
        <div className="flex items-center justify-between">
          <img src={logo} alt="Tailormade" className="h-8 w-auto" />
          <button
            type="button"
            className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white"
            aria-label="Profile"
          >
            <UserRound size={18} />
          </button>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-black">
          Take Measurement
        </h2>
        <p className="mt-2 text-sm text-gray-500">Record customer measurements</p>
      </section>

      <form className="mt-8 space-y-6" onSubmit={onSubmit}>
        <div className="relative">
          <Input
            label="Customer Name"
            placeholder="Enter customer name"
            autoComplete="name"
            readOnly={Boolean(selectedCustomerId)}
            error={errors.customerName?.message ?? duplicateNameError}
            onFocus={() => setShowSuggestions(true)}
            {...customerNameField}
            onBlur={(event) => {
              customerNameField.onBlur(event)
              window.setTimeout(() => setShowSuggestions(false), 120)
            }}
          />

          {selectedCustomerId ? (
            <button
              type="button"
              onClick={clearSelectedCustomer}
              className="tap-feedback mt-2 text-xs font-semibold text-gray-600"
            >
              Change customer
            </button>
          ) : null}

          {showSuggestions && suggestions.length > 0 ? (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-sm">
              {suggestions.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onMouseDown={() => applyExistingCustomer(customer.id)}
                  className="tap-feedback flex w-full items-start justify-between px-3 py-3 text-left hover:bg-gray-50"
                >
                  <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                  <span className="text-xs text-gray-500">{customer.phone}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <Input
          label="Customer Phone number"
          placeholder="Enter Customer phone number"
          inputMode="tel"
          readOnly={Boolean(selectedCustomerId)}
          error={errors.customerPhone?.message}
          {...register('customerPhone')}
        />

        <Input
          label="Measurement Name"
          placeholder="What are you measuring ( e.g Corset , kaftan )"
          error={errors.measurementName?.message}
          {...register('measurementName')}
        />

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-text">Measurement (Inches )</h3>
            <p className="mt-1 text-sm text-gray-500">Add parts you want to measure</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {rows.map((row) => (
              <div key={row.id} className="space-y-2">
                <p className="px-0 text-sm font-semibold text-gray-800">{row.label}</p>
                <div className="relative">
                  <input
                    value={row.value}
                    onChange={(event) => updateRowValue(row.id, event.target.value)}
                    inputMode="decimal"
                    placeholder="0 inches"
                    autoFocus={autoFocusRowId === row.id}
                    onFocus={() => {
                      if (autoFocusRowId === row.id) {
                        setAutoFocusRowId(null)
                      }
                    }}
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-4 pr-11 text-base text-gray-600 placeholder:text-gray-500 focus:border-black focus:ring-black/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeMeasurementRow(row.id)}
                    className="tap-feedback absolute inset-y-0 right-3 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-black"
                    aria-label={`Remove ${row.label || 'measurement'} part`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {rowErrors[row.id] ? (
                  <p className="text-xs text-error">{rowErrors[row.id]}</p>
                ) : null}
              </div>
            ))}
          </div>

          {partsError ? <p className="text-xs text-error">{partsError}</p> : null}

          {isAddingPart ? (
            <div className="rounded-xl border border-gray-300 bg-white p-3 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text">
                  Measurement part name
                </span>
                <input
                  value={newPartLabel}
                  onChange={(event) => {
                    setNewPartLabel(event.target.value)
                    if (newPartError) {
                      setNewPartError('')
                    }
                  }}
                  placeholder="e.g Shoulder"
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      confirmAddMeasurementRow()
                    }
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-text placeholder:text-muted focus:border-black focus:ring-black/20"
                />
                {newPartError ? (
                  <span className="mt-1 block text-xs text-error">{newPartError}</span>
                ) : null}
              </label>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 flex-1 rounded-lg text-sm font-semibold"
                  onClick={cancelAddMeasurementRow}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-10 flex-1 rounded-lg bg-black text-sm font-semibold text-white hover:bg-black/95"
                  onClick={confirmAddMeasurementRow}
                >
                  Add
                </Button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={addMeasurementRow}
            className="tap-feedback inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-base font-semibold text-gray-900"
          >
            <Plus size={20} />
            Add measurement
          </button>
        </section>

        <Input
          label="Delivery Date"
          type="date"
          placeholder="Enter delivery date"
          error={errors.deliveryDate?.message}
          {...register('deliveryDate')}
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-text">Agreed Price</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-medium text-gray-700">
              {'\u20A6'}
            </span>
            <input
              inputMode="decimal"
              placeholder="0"
              className="w-full rounded-xl border-border bg-white pl-8 pr-3 text-base text-text shadow-sm transition placeholder:text-muted focus:border-black focus:ring-black/20"
              {...register('agreedPrice')}
            />
          </div>
          {errors.agreedPrice?.message ? (
            <span className="mt-1 block text-xs text-error">{errors.agreedPrice.message}</span>
          ) : null}
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium text-text">
            Add Inspiration Photos <span className="text-sm font-medium text-gray-400">(optional)</span>
          </p>
          {inspirationPhotos.length === 0 ? (
            <label className="tap-feedback flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  if (files.length > 0) {
                    appendInspirationPhotos(files)
                  }
                  event.currentTarget.value = ''
                }}
              />
              <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600">
                <Upload size={18} />
              </span>
              <span className="text-base font-semibold text-gray-900">Click to upload</span>
              <span className="mt-1 text-sm text-gray-500">PNG, JPG (max.5mb)</span>
            </label>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {inspirationPhotos.map((photoUrl, index) => (
                <div
                  key={`inspiration-preview-${index}`}
                  className="relative overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <img
                    src={photoUrl}
                    alt={`Inspiration preview ${index + 1}`}
                    className="h-20 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeInspirationPhoto(index)}
                    className="tap-feedback absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-sm font-semibold text-white"
                    aria-label={`Remove inspiration photo ${index + 1}`}
                  >
                    x
                  </button>
                </div>
              ))}

              <label className="tap-feedback flex h-20 cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? [])
                    if (files.length > 0) {
                      appendInspirationPhotos(files)
                    }
                    event.currentTarget.value = ''
                  }}
                />
                <Plus size={22} />
              </label>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-text">
            Fabric Photos <span className="text-sm font-medium text-gray-400">(optional)</span>
          </p>
          {fabricPhotos.length === 0 ? (
            <label className="tap-feedback flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  if (files.length > 0) {
                    appendFabricPhotos(files)
                  }
                  event.currentTarget.value = ''
                }}
              />
              <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600">
                <Upload size={18} />
              </span>
              <span className="text-base font-semibold text-gray-900">Click to upload</span>
              <span className="mt-1 text-sm text-gray-500">PNG, JPG (max.5mb)</span>
            </label>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {fabricPhotos.map((photoUrl, index) => (
                <div
                  key={`fabric-preview-${index}`}
                  className="relative overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <img
                    src={photoUrl}
                    alt={`Fabric preview ${index + 1}`}
                    className="h-20 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFabricPhoto(index)}
                    className="tap-feedback absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-sm font-semibold text-white"
                    aria-label={`Remove fabric photo ${index + 1}`}
                  >
                    x
                  </button>
                </div>
              ))}

              <label className="tap-feedback flex h-20 cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? [])
                    if (files.length > 0) {
                      appendFabricPhotos(files)
                    }
                    event.currentTarget.value = ''
                  }}
                />
                <Plus size={22} />
              </label>
            </div>
          )}
        </div>

        {saveError ? <p className="text-sm text-error">{saveError}</p> : null}
      </form>

      <div className="fixed left-0 right-0 bottom-24 z-20">
        <div className="max-w-md mx-auto px-5">
          <Button
            type="submit"
            onClick={() => void onSubmit()}
            disabled={isSaving}
            className="h-14 w-full rounded-xl bg-black text-white text-lg font-semibold shadow-sm hover:bg-black/95"
          >
            {isSaving ? 'Saving...' : 'Save Measurement'}
          </Button>
        </div>
      </div>
    </div>
  )
}
