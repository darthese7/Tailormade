import { cn } from '@/lib/utils/cn'
import { useToastStore } from '@/components/primitives/toastStore'

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] mx-auto flex w-full max-w-md flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={cn(
            'pointer-events-auto rounded-xl p-3 text-left text-sm font-medium shadow-card',
            toast.variant === 'success' && 'bg-success text-white',
            toast.variant === 'error' && 'bg-error text-white',
            toast.variant === 'info' && 'bg-text text-white',
          )}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </button>
      ))}
    </div>
  )
}
