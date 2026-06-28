'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types'
import { MEAT_TYPES, STATUS_LABELS } from '@/lib/constants'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { format } from 'date-fns'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email ?? null)
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false })
      if (data) setOrders(data as Order[])
      setLoading(false)
    }
    load()
  }, [router, supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <header className="bg-wine-700 text-cream-50">
          <div className="max-w-4xl mx-auto px-4 py-4 h-14" />
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <div className="skeleton h-8 w-48 mb-6" />
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-wine-700/95 text-cream-50 shadow-warm-lg backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-brass-400 to-brass-600 flex items-center justify-center font-display font-bold text-lg text-wine-800 ring-2 ring-cream-50/20 transition-transform duration-500 group-hover:scale-105">A</div>
            <span className="font-display font-semibold text-lg">Ahadu Fresh Meat</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-cream-100 hover:text-white text-sm transition-colors">Place order</Link>
            <button onClick={handleSignOut} className="text-sm bg-cream-50/10 hover:bg-cream-50/20 px-3.5 py-1.5 rounded-full ring-1 ring-cream-50/15 transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 animate-fade-in-up">
          <h1 className="font-display text-3xl font-semibold text-wine-700">My orders</h1>
          <p className="text-warmgray-500 text-sm mt-1">{userEmail}</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-cream-50 rounded-2xl ring-1 ring-cream-300 shadow-warm p-16 text-center animate-fade-in-up">
            <div className="text-5xl mb-4 animate-floaty inline-block">🥩</div>
            <p className="font-display text-xl text-charcoal mb-2">No orders yet</p>
            <p className="text-warmgray-500 text-sm mb-6">Place your first meat reservation to see it here.</p>
            <Link
              href="/"
              className="inline-block px-7 py-3.5 rounded-xl bg-linear-to-br from-wine-600 to-wine-800 hover:brightness-110 active:scale-[0.99] text-cream-50 font-semibold transition-all duration-300 shadow-warm"
            >
              Place an order
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const meatItems = MEAT_TYPES.filter(mt => order[mt.key] > 0)
              return (
                <div key={order.id} className={`bg-cream-50 rounded-2xl ring-1 ring-cream-300 shadow-warm card-lift p-5 animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-display font-semibold text-lg text-charcoal">
                        {format(new Date(order.pickup_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-xs text-warmgray-400 mt-0.5">
                        Ordered {format(new Date(order.created_at), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Meat items */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {meatItems.map(mt => (
                      <span
                        key={mt.key}
                        className="inline-flex items-center gap-1.5 bg-wine-50 text-wine-700 ring-1 ring-wine-100 text-sm px-3 py-1 rounded-full font-medium"
                      >
                        <span>{mt.icon}</span>
                        {mt.label} — {order[mt.key]} lb{order[mt.key] !== 1 ? 's' : ''}
                      </span>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-sm text-warmgray-500 italic">Note: {order.notes}</p>
                  )}

                  {/* Status progress */}
                  <div className="mt-4 pt-4 border-t border-cream-300">
                    <div className="flex items-center gap-0">
                      {(['pending', 'confirmed', 'ready', 'picked_up'] as const).map((s, idx) => {
                        const statuses = ['pending', 'confirmed', 'ready', 'picked_up']
                        const currentIndex = statuses.indexOf(order.status)
                        const stepIndex = statuses.indexOf(s)
                        const done = stepIndex <= currentIndex
                        return (
                          <div key={s} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                              <div className={`w-3.5 h-3.5 rounded-full transition-colors ${done ? 'bg-linear-to-br from-wine-500 to-wine-700 ring-2 ring-wine-100' : 'bg-cream-300'}`} />
                              <span className={`text-xs mt-1.5 whitespace-nowrap ${done ? 'text-wine-700 font-semibold' : 'text-warmgray-400'}`}>
                                {STATUS_LABELS[s]}
                              </span>
                            </div>
                            {idx < 3 && (
                              <div className={`h-0.5 flex-1 mx-1 mb-5 rounded-full transition-colors ${stepIndex < currentIndex ? 'bg-wine-500' : 'bg-cream-300'}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
