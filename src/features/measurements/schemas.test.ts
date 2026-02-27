import { describe, expect, it } from 'vitest'
import {
  createJobFromMeasurementSchema,
  measurementPartInputSchema,
  takeMeasurementSchema,
} from '@/features/measurements/schemas'

describe('takeMeasurementSchema', () => {
  it('validates required fields and normalizes phone', () => {
    const parsed = takeMeasurementSchema.parse({
      customerName: 'Ese',
      customerPhone: '0803 111 2222',
      measurementName: 'Kaftan',
      deliveryDate: '',
      agreedPrice: '',
    })

    expect(parsed.customerPhone).toBe('+2348031112222')
    expect(parsed.measurementName).toBe('Kaftan')
  })

  it('rejects invalid agreed price when provided', () => {
    const result = takeMeasurementSchema.safeParse({
      customerName: 'Ese',
      customerPhone: '08031112222',
      measurementName: 'Kaftan',
      agreedPrice: '0',
    })

    expect(result.success).toBe(false)
  })
})

describe('measurementPartInputSchema', () => {
  it('accepts numeric values including zero', () => {
    const parsed = measurementPartInputSchema.parse({
      id: 'part_1',
      label: 'Bust',
      value: '0',
      unit: 'inches',
    })

    expect(parsed.value).toBe('0')
  })
})

describe('createJobFromMeasurementSchema', () => {
  it('requires delivery date and positive price', () => {
    const result = createJobFromMeasurementSchema.safeParse({
      deliveryDate: '',
      agreedPrice: 0,
    })

    expect(result.success).toBe(false)
  })
})
