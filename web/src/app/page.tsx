import { SiteHeader } from '@/components/shared/SiteHeader'
import { OrderForm } from '@/components/order/OrderForm'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      {/* How it works banner */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white border-l-4 border-[#8B0000] rounded-lg px-5 py-3 text-sm text-gray-700 shadow-sm">
          <span className="font-semibold">How it works:</span> Place your reservation → We prepare your order → Pick up at Ahadu Market
        </div>
      </div>

      {/* Order Form */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="bg-[#8B0000] rounded-t-2xl px-6 py-4">
            <span className="inline-block bg-red-100 text-[#8B0000] text-xs font-semibold px-3 py-1 rounded-full">
              Customer Form
            </span>
          </div>
          <OrderForm />
        </div>
      </div>
    </div>
  )
}
