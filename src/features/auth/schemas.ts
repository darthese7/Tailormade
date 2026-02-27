import { z } from 'zod'
import { normalizePhone } from '@/lib/utils/phone'

export const requestOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a valid phone number')
    .transform((value) => normalizePhone(value)),
})

export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(4, 'OTP must be at least 4 digits')
    .max(6, 'OTP must be at most 6 digits'),
})

export const usernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'Username must be at least 2 characters')
    .max(30, 'Username must be 30 characters or less'),
})

export type RequestOtpSchemaInput = z.infer<typeof requestOtpSchema>
export type VerifyOtpSchemaInput = z.infer<typeof verifyOtpSchema>
export type UsernameSchemaInput = z.infer<typeof usernameSchema>
