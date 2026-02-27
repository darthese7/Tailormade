import { ReactNode } from 'react'
import { Button } from '@/components/primitives/Button'
import { cn } from '@/lib/utils/cn'

interface BottomSheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black/35 transition duration-200',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border border-border/70 bg-white p-4 shadow-card transition-transform duration-200',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="secondary" className="h-10 px-3" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="overflow-y-auto pb-2">{children}</div>
      </div>
    </div>
  )
}
