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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-warmgray-500">
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-brass-400 to-brass-600 flex items-center justify-center font-display font-bold text-xl text-wine-800 animate-floaty">A</div>
          <span className="text-sm tracking-wide">Preparing your order page…</span>
        </div>
      </div>
    )
  }

  const steps = [
    { n: '01', t: 'Reserve', d: 'Pick your cuts & pickup day' },
    { n: '02', t: 'We prepare', d: 'Fresh, cut to order' },
    { n: '03', t: 'Pick up', d: 'Collect at Ahadu Market' },
  ]

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-cream-200/60 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-10 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-brass-600 animate-fade-in-up">
            <span className="h-px w-6 bg-brass-500" /> Ahadu Market <span className="h-px w-6 bg-brass-500" />
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-wine-700 mt-4 leading-[1.05] animate-fade-in-up stagger-1">
            Reserve your cut,<br />
            <span className="text-charcoal">pick up fresh.</span>
          </h1>
          <p className="text-warmgray-600 mt-5 max-w-md mx-auto text-base animate-fade-in-up stagger-2">
            Order premium Ethiopian cuts online and collect them fresh at the counter — no waiting, no guessing.
          </p>

          {/* Steps */}
          <div className="mt-9 grid grid-cols-3 gap-3 max-w-2xl mx-auto animate-fade-in-up stagger-3">
            {steps.map(s => (
              <div key={s.n} className="rounded-2xl bg-cream-50/70 ring-1 ring-cream-300 px-3 py-4 text-left">
                <p className="font-display text-brass-500 text-lg font-semibold">{s.n}</p>
                <p className="font-semibold text-charcoal text-sm mt-1">{s.t}</p>
                <p className="text-warmgray-500 text-xs mt-0.5 leading-snug">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Order Form */}
      <div className="max-w-3xl mx-auto px-4 pb-16 animate-fade-in-up stagger-4">
        <div className="bg-cream-50 rounded-2xl shadow-warm-lg ring-1 ring-cream-300 overflow-hidden">
          <div className="bg-linear-to-br from-wine-700 to-wine-800 px-6 sm:px-8 py-7">
            <span className="inline-block bg-cream-50/15 ring-1 ring-cream-50/20 text-brass-300 text-xs font-semibold tracking-wide px-3 py-1 rounded-full mb-3">
              Reservation
            </span>
            <h2 className="font-display text-cream-50 text-2xl sm:text-3xl font-semibold">Build your order</h2>
            <p className="text-brass-300 text-sm mt-1">Choose your cuts and the day you&apos;ll collect.</p>
          </div>
          <OrderForm />
        </div>
      </div>
    </div>
  )
}
