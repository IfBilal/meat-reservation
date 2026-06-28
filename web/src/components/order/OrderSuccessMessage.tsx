'use client'

interface Props {
  email: string
  onReset: () => void
}

export function OrderSuccessMessage({ email, onReset }: Props) {
  return (
    <div className="text-center py-14 px-4 animate-scale-in">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-brass-300/30 blur-xl" />
        <div className="relative w-24 h-24 rounded-full bg-linear-to-br from-brass-300 to-brass-500 flex items-center justify-center shadow-warm ring-2 ring-cream-50">
          <svg className="w-11 h-11 text-wine-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <h2 className="font-display text-3xl font-semibold text-wine-700 mb-2">Order received!</h2>
      <p className="text-warmgray-600 mb-1">Your reservation has been submitted successfully.</p>
      <p className="text-warmgray-500 text-sm mb-8">
        A confirmation has been sent to <span className="font-semibold text-charcoal">{email}</span>
      </p>
      <button
        onClick={onReset}
        className="px-7 py-3.5 rounded-xl bg-linear-to-br from-wine-600 to-wine-800 hover:brightness-110 active:scale-[0.98] text-cream-50 font-semibold transition-all shadow-warm"
      >
        Place another order
      </button>
    </div>
  )
}
