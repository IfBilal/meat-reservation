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
    <div className={`animate-fade-in-up ${staggerClass} flex items-center justify-between py-4 border-b border-cream-300 last:border-0 group ${value > 0 ? 'is-active' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-all duration-300 group-hover:scale-105 ring-1 ${value > 0 ? 'bg-linear-to-br from-wine-50 to-wine-100 ring-wine-100 shadow-warm' : 'bg-cream-200 ring-cream-300'}`}>
          {icon}
        </div>
        <div>
          <p className="font-semibold text-charcoal text-[15px]">{label}</p>
          <p className="text-xs text-warmgray-500 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="w-9 h-9 rounded-full border border-cream-300 flex items-center justify-center text-warmgray-600 font-bold text-lg hover:border-wine-500 hover:text-wine-600 hover:bg-wine-50 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all duration-200"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="w-16 text-center">
          <span className={`text-lg font-bold tabular-nums transition-colors duration-200 ${value > 0 ? 'text-wine-700' : 'text-warmgray-400'}`}>
            {value}
          </span>
          <span className="text-xs text-warmgray-400 ml-1">{value === 1 ? 'lb' : 'lbs'}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full bg-linear-to-br from-wine-600 to-wine-800 flex items-center justify-center text-cream-50 font-bold text-lg hover:brightness-110 active:scale-95 transition-all duration-200 shadow-warm"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
