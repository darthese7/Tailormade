import { X } from 'lucide-react'

interface DeliverConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting?: boolean
}

export function DeliverConfirmModal({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: DeliverConfirmModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-5"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="tap-feedback absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500"
          aria-label="Close confirmation"
        >
          <X size={28} />
        </button>

        <h3 className="pr-12 text-xl font-semibold tracking-tight leading-tight text-gray-900">
          Mark this job as delivered?
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          This will move it to delivered jobs.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="tap-feedback h-12 rounded-xl border border-gray-200 bg-white text-base font-semibold text-gray-900 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="tap-feedback h-12 rounded-xl bg-black text-base font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
