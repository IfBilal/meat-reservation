'use client'

interface MeatCounterProps {
  label: string
  description: string
  value: number
  onChange: (newValue: number) => void
}

export function MeatCounter({ label, description, value, onChange }: MeatCounterProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg hover:bg-red-50 hover:border-red-400 hover:text-[#8B0000] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-colors"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="w-14 text-center text-base font-semibold text-gray-800 tabular-nums">
          {value} lb{value !== 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg hover:bg-red-50 hover:border-red-400 hover:text-[#8B0000] transition-colors"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
