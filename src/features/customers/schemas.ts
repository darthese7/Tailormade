import { z } from 'zod'
import { normalizePhone } from '@/lib/utils/phone'

export const addCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .transform((value) => normalizePhone(value)),
  notes: z.string().trim().optional(),
})

export type AddCustomerInput = z.infer<typeof addCustomerSchema>

