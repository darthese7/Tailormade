import { z } from 'zod'
import { normalizePhone } from '@/lib/utils/phone'

const phoneSchema = z
  .string()
  .min(10, 'Enter a valid phone number')
  .transform((value) => normalizePhone(value))

const passwordSchema = z
  .string()
  .trim()
  .min(6, 'Password must be at least 6 characters')
  .max(64, 'Password must be 64 characters or less')

export const loginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
})

export const signupSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a valid phone number')
    .transform((value) => normalizePhone(value)),
  username: z
    .string()
    .trim()
    .min(2, 'Username must be at least 2 characters')
    .max(30, 'Username must be 30 characters or less'),
  password: passwordSchema,
})

export type LoginSchemaInput = z.infer<typeof loginSchema>
export type SignupSchemaInput = z.infer<typeof signupSchema>
