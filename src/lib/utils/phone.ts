export function normalizePhone(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[^\d+]/g, '').trim()
  if (!cleaned) {
    return ''
  }

  if (cleaned.startsWith('+')) {
    return cleaned
  }

  if (cleaned.startsWith('0')) {
    return `+234${cleaned.slice(1)}`
  }

  if (cleaned.startsWith('234')) {
    return `+${cleaned}`
  }

  return `+234${cleaned}`
}

export function phoneForWhatsapp(phone: string): string {
  return normalizePhone(phone).replace('+', '')
}

