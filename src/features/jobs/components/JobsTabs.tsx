type JobsTabValue = 'ongoing' | 'delivered'

interface JobsTabsProps {
  activeTab: JobsTabValue
  ongoingCount: number
  deliveredCount: number
  onChange: (value: JobsTabValue) => void
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-700">
      {value}
    </span>
  )
}

export function JobsTabs({
  activeTab,
  ongoingCount,
  deliveredCount,
  onChange,
}: JobsTabsProps) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onChange('ongoing')}
        className={[
          'tap-feedback h-12 rounded-xl text-lg font-semibold',
          activeTab === 'ongoing' ? 'bg-black text-white' : 'bg-transparent text-gray-500',
        ].join(' ')}
      >
        <span className="inline-flex items-center gap-2">
          Ongoing
          <CountBadge value={ongoingCount} />
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange('delivered')}
        className={[
          'tap-feedback h-12 rounded-xl text-lg font-semibold',
          activeTab === 'delivered' ? 'bg-black text-white' : 'bg-transparent text-gray-500',
        ].join(' ')}
      >
        <span className="inline-flex items-center gap-2">
          Delivered
          <CountBadge value={deliveredCount} />
        </span>
      </button>
    </div>
  )
}
