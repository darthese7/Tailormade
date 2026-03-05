import { z } from 'zod'
import { normalizePhone } from '@/lib/utils/phone'

export const measurementPartInputSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1, 'Part label is required'),
  value: z
    .string()
    .trim()
    .min(1, 'Measurement value is required')
    .refine((value) => !Number.isNaN(Number(value)), 'Enter a valid number')
    .refine((value) => Number(value) >= 0, 'Value must be zero or greater'),
  unit: z.literal('inches'),
})

export const takeMeasurementSchema = z.object({
  customerName: z.string().trim().min(2, 'Customer name is required'),
  customerPhone: z
    .string()
    .trim()
    .min(10, 'Customer phone is required')
    .transform((value) => normalizePhone(value)),
  measurementName: z.string().trim().min(2, 'Measurement name is required'),
  deliveryDate: z.string().trim().optional(),
  agreedPrice: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) > 0), {
      message: 'Agreed price must be greater than 0',
    }),
})

export const createJobFromMeasurementSchema = z.object({
  deliveryDate: z.string().trim().optional().nullable(),
  agreedPrice: z.number().positive('Agreed price must be greater than 0').optional().nullable(),
})

export type MeasurementPartInput = z.infer<typeof measurementPartInputSchema>
export type TakeMeasurementInput = z.infer<typeof takeMeasurementSchema>
export type CreateJobFromMeasurementInput = z.infer<typeof createJobFromMeasurementSchema>
