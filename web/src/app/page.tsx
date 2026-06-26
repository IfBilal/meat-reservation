'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { OrderForm } from '@/components/order/OrderForm'

export default function HomePage() {
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
      } else {
        setReady(true)
      }
    })
  }, [router, supabase])

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      {/* How it works banner */}
      <div className="max-w-4xl mx-auto px-4 mt-6 animate-fade-in-up">
        <div className="bg-white border-l-4 border-[#8B0000] rounded-xl px-5 py-3.5 text-sm text-gray-600 shadow-sm flex items-center gap-2">
          <span className="text-[#8B0000] text-base">ℹ️</span>
          <span>
            <span className="font-semibold text-gray-800">How it works: </span>
            Place your reservation → We prepare your order → Pick up at Ahadu Market
          </span>
        </div>
      </div>

      {/* Order Form */}
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in-up stagger-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-linear-to-r from-[#8B0000] to-[#6b0000] px-6 py-5">
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
              Customer Form
            </span>
            <h2 className="text-white text-xl font-bold">Reserve Your Meat Order</h2>
            <p className="text-red-200 text-sm mt-0.5">Pick up fresh at Ahadu Market</p>
          </div>
          <OrderForm />
        </div>
      </div>
    </div>
  )
}
