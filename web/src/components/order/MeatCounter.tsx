'use client'

interface MeatCounterProps {
  label: string
  description: string
  icon: string
  value: number
  onChange: (newValue: number) => void
  index?: number
}

export function MeatCounter({ label, description, icon, value, onChange, index = 0 }: MeatCounterProps) {
  const staggerClass = `stagger-${Math.min(index + 1, 6)}`

  return (
    <div className={`animate-fade-in-up ${staggerClass} flex items-center justify-between py-4 border-b border-gray-100 last:border-0 group`}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center text-2xl shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-200">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-[15px]">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg hover:border-[#8B0000] hover:text-[#8B0000] hover:bg-red-50 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="w-16 text-center">
          <span className={`text-base font-bold tabular-nums transition-colors duration-150 ${value > 0 ? 'text-[#8B0000]' : 'text-gray-300'}`}>
            {value}
          </span>
          <span className="text-xs text-gray-400 ml-1">{value === 1 ? 'lb' : 'lbs'}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full bg-[#8B0000] flex items-center justify-center text-white font-bold text-lg hover:bg-[#6b0000] active:scale-95 transition-all duration-150"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
