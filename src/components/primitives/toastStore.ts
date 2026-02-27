import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastStore {
  toasts: ToastItem[]
  pushToast: (message: string, variant?: ToastVariant) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  pushToast: (message, variant = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }))
    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }))
    }, 2400)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}))

