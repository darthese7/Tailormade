import { describe, expect, it } from 'vitest'
import { addCustomerSchema } from '@/features/customers/schemas'
import { MEASUREMENT_TEMPLATES, newJobSchema } from '@/features/jobs/schemas'

describe('addCustomerSchema', () => {
  it('normalizes phone and validates required fields', () => {
    const parsed = addCustomerSchema.parse({
      name: 'Maryam',
      phone: '0803 111 2222',
      notes: 'Prefers long sleeves',
    })

    expect(parsed.phone).toBe('+2348031112222')
    expect(parsed.name).toBe('Maryam')
  })
})

describe('newJobSchema', () => {
  const template = MEASUREMENT_TEMPLATES[0]

  it('accepts valid job payload with measurement snapshot', () => {
    const parsed = newJobSchema.parse({
      customerId: 'cus_1',
      deliveryDate: '2026-03-01',
      agreedPrice: 25000,
      status: 'ongoing',
      measurementSnapshot: {
        templateId: template.id,
        templateName: template.name,
        fields: template.fields.map((field) => ({ ...field, value: '30' })),
      },
    })

    expect(parsed.customerId).toBe('cus_1')
    expect(parsed.measurementSnapshot.fields).toHaveLength(template.fields.length)
  })

  it('rejects payload without measurement snapshot fields', () => {
    const result = newJobSchema.safeParse({
      customerId: 'cus_1',
      deliveryDate: '2026-03-01',
      agreedPrice: 25000,
      status: 'ongoing',
      measurementSnapshot: {
        templateId: template.id,
        templateName: template.name,
        fields: [],
      },
    })

    expect(result.success).toBe(false)
  })
})

