import { cn } from '@/lib/utils/cn'

interface TabOption {
  value: string
  label: string
}

interface TabsProps {
  value: string
  options: TabOption[]
  onChange: (value: string) => void
}

export function Tabs({ value, options, onChange }: TabsProps) {
  return (
    <div className="grid grid-cols-2 rounded-xl border border-border bg-white p-1 shadow-card">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'tap-feedback h-12 min-h-12 rounded-xl text-sm font-semibold',
            value === option.value
              ? 'bg-primary text-white'
              : 'text-muted hover:bg-gray-50',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
