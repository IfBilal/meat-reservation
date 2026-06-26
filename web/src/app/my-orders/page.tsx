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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading your orders...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#8B0000] text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">A</div>
            <span className="font-bold text-lg">Ahadu Fresh Meat</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-red-200 hover:text-white text-sm transition-colors">Place Order</Link>
            <button onClick={handleSignOut} className="text-red-200 hover:text-white text-sm transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{userEmail}</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">🥩</div>
            <p className="text-gray-600 font-medium mb-2">No orders yet</p>
            <p className="text-gray-400 text-sm mb-6">Place your first meat reservation below</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white font-semibold text-sm transition-colors"
            >
              Place an Order
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const meatItems = MEAT_TYPES.filter(mt => order[mt.key] > 0)
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Pickup: {format(new Date(order.pickup_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
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
                        className="inline-flex items-center gap-1.5 bg-red-50 text-[#8B0000] text-sm px-3 py-1 rounded-full font-medium"
                      >
                        <span>{mt.icon}</span>
                        {mt.label} — {order[mt.key]} lb{order[mt.key] !== 1 ? 's' : ''}
                      </span>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-sm text-gray-500 italic">Note: {order.notes}</p>
                  )}

                  {/* Status progress */}
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-0">
                      {(['pending', 'confirmed', 'ready', 'picked_up'] as const).map((s, i) => {
                        const statuses = ['pending', 'confirmed', 'ready', 'picked_up']
                        const currentIndex = statuses.indexOf(order.status)
                        const stepIndex = statuses.indexOf(s)
                        const done = stepIndex <= currentIndex
                        return (
                          <div key={s} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${done ? 'bg-[#8B0000]' : 'bg-gray-200'}`} />
                              <span className={`text-xs mt-1 whitespace-nowrap ${done ? 'text-[#8B0000] font-medium' : 'text-gray-400'}`}>
                                {STATUS_LABELS[s]}
                              </span>
                            </div>
                            {i < 3 && (
                              <div className={`h-0.5 flex-1 mx-1 mb-4 ${stepIndex < currentIndex ? 'bg-[#8B0000]' : 'bg-gray-200'}`} />
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
