import { describe, expect, it } from 'vitest'
import { normalizePhone, phoneForWhatsapp } from '@/lib/utils/phone'

describe('normalizePhone', () => {
  it('normalizes local Nigerian phone format', () => {
    expect(normalizePhone('0803 123 4567')).toBe('+2348031234567')
  })

  it('normalizes plain country code format', () => {
    expect(normalizePhone('2348031234567')).toBe('+2348031234567')
  })

  it('keeps plus-prefixed numbers', () => {
    expect(normalizePhone('+2348031234567')).toBe('+2348031234567')
  })
})

describe('phoneForWhatsapp', () => {
  it('returns normalized number without plus', () => {
    expect(phoneForWhatsapp('08031234567')).toBe('2348031234567')
  })
})

