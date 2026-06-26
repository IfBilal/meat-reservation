'use client'

interface Props {
  email: string
  onReset: () => void
}

export function OrderSuccessMessage({ email, onReset }: Props) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Received!</h2>
      <p className="text-gray-600 mb-1">Your reservation has been submitted successfully.</p>
      <p className="text-gray-500 text-sm mb-8">
        A confirmation has been sent to <span className="font-medium text-gray-700">{email}</span>
      </p>
      <button
        onClick={onReset}
        className="px-6 py-3 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white font-semibold transition-colors"
      >
        Place Another Order
      </button>
    </div>
  )
}
