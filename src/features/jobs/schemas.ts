import { z } from 'zod'

export const measurementFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  unit: z.string().min(1),
  value: z.string().trim().min(1, 'Measurement value is required'),
})

export const measurementSnapshotSchema = z.object({
  templateId: z.string().min(1, 'Choose a template'),
  templateName: z.string().min(1),
  fields: z.array(measurementFieldSchema).min(1, 'Add at least one measurement'),
})

export const newJobSchema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  agreedPrice: z.number().positive('Agreed price must be greater than 0'),
  status: z.enum(['ongoing', 'ready', 'delivered']),
  measurementSnapshot: measurementSnapshotSchema,
  styleImageUrl: z.string().optional(),
  fabricImageUrl: z.string().optional(),
})

export type NewJobInput = z.infer<typeof newJobSchema>

export interface MeasurementTemplate {
  id: string
  name: string
  fields: Array<{ key: string; label: string; unit: string }>
}

export const MEASUREMENT_TEMPLATES: MeasurementTemplate[] = [
  {
    id: 'female-gown',
    name: 'Female Gown',
    fields: [
      { key: 'bust', label: 'Bust', unit: 'in' },
      { key: 'waist', label: 'Waist', unit: 'in' },
      { key: 'hip', label: 'Hip', unit: 'in' },
      { key: 'shoulder', label: 'Shoulder', unit: 'in' },
      { key: 'sleeve', label: 'Sleeve Length', unit: 'in' },
      { key: 'gown-length', label: 'Gown Length', unit: 'in' },
    ],
  },
  {
    id: 'senator',
    name: 'Senator Wear',
    fields: [
      { key: 'chest', label: 'Chest', unit: 'in' },
      { key: 'waist', label: 'Waist', unit: 'in' },
      { key: 'hip', label: 'Hip', unit: 'in' },
      { key: 'top-length', label: 'Top Length', unit: 'in' },
      { key: 'trouser-length', label: 'Trouser Length', unit: 'in' },
      { key: 'thigh', label: 'Thigh', unit: 'in' },
    ],
  },
  {
    id: 'shirt-trouser',
    name: 'Shirt and Trouser',
    fields: [
      { key: 'neck', label: 'Neck', unit: 'in' },
      { key: 'chest', label: 'Chest', unit: 'in' },
      { key: 'shoulder', label: 'Shoulder', unit: 'in' },
      { key: 'arm', label: 'Arm Length', unit: 'in' },
      { key: 'waist', label: 'Waist', unit: 'in' },
      { key: 'inseam', label: 'Inseam', unit: 'in' },
    ],
  },
]
