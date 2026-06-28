'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderStatus } from '@/types'
import { MEAT_TYPES, STATUS_LABELS } from '@/lib/constants'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { TotalsPanel } from '@/components/admin/TotalsPanel'
import { exportOrdersToExcel } from '@/lib/excel'
import { format } from 'date-fns'

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setOrders(data as Order[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders, supabase])

  const filtered = orders.filter(o => {
    const matchSearch = search === '' || [o.customer_name, o.customer_phone, o.customer_email]
      .some(v => v.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const matchDate = dateFilter === '' || o.pickup_date === dateFilter
    return matchSearch && matchStatus && matchDate
  })

  async function changeStatus(order: Order, status: OrderStatus) {
    if (status === order.status) return
    setUpdatingId(order.id)
    await supabase.from('orders').update({ status }).eq('id', order.id)
    setUpdatingId(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-28 w-full rounded-2xl" />
        <div className="skeleton h-10 w-full rounded-lg" />
        <div className="skeleton h-72 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div>
      <TotalsPanel orders={filtered} dateFilter={dateFilter || undefined} />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5 print:hidden">
        <input
          type="text"
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-50 border border-cream-300 bg-cream-50 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-warmgray-400 focus:outline-none focus:ring-2 focus:ring-wine-500/25 focus:border-wine-500 transition-all"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="border border-cream-300 bg-cream-50 rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-wine-500/25 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="border border-cream-300 bg-cream-50 rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-wine-500/25"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-xs text-warmgray-500 hover:text-wine-600 underline"
          >
            Clear date
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => exportOrdersToExcel(filtered)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-charcoal hover:bg-cream-100 hover:border-wine-300 disabled:opacity-40 disabled:hover:bg-cream-50 disabled:hover:border-cream-300 text-sm font-medium transition-colors"
          >
            Export Excel
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-charcoal hover:bg-cream-100 hover:border-wine-300 text-sm font-medium transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      {/* Print header (hidden on screen) */}
      <div className="print-header hidden">
        Ahadu Fresh Meat — Orders ({format(new Date(), 'MMMM d, yyyy')})
      </div>

      {/* Count */}
      <p className="text-sm text-warmgray-500 mb-3 print:hidden">
        Showing <span className="font-semibold text-charcoal">{filtered.length}</span> of {orders.length} orders
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-warmgray-400 bg-cream-50 rounded-2xl ring-1 ring-cream-300">
          <p className="text-4xl mb-3 animate-floaty inline-block">🥩</p>
          <p className="font-display text-lg text-charcoal">No orders found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="bg-cream-50 rounded-2xl ring-1 ring-cream-300 shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream-200/60 border-b border-cream-300">
                  <th className="text-left px-4 py-3 font-semibold text-warmgray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-warmgray-600">Pickup Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-warmgray-600">Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-warmgray-600">Notes</th>
                  <th className="text-left px-4 py-3 font-semibold text-warmgray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-warmgray-600 print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {filtered.map(order => {
                  const meatItems = MEAT_TYPES.filter(mt => order[mt.key] > 0)
                    .map(mt => `${mt.label} ${order[mt.key]}lb`)

                  return (
                    <tr key={order.id} className="hover:bg-cream-100/70 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-charcoal">{order.customer_name}</p>
                        <p className="text-warmgray-500 text-xs">{order.customer_phone}</p>
                        <p className="text-warmgray-400 text-xs">{order.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-charcoal">
                        {format(new Date(order.pickup_date + 'T00:00:00'), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {meatItems.map(item => (
                            <span key={item} className="inline-block bg-wine-50 text-wine-700 ring-1 ring-wine-100 text-xs px-2 py-0.5 rounded-full font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-warmgray-500 max-w-45">
                        <p className="truncate">{order.notes ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 print:hidden">
                        <select
                          value={order.status}
                          onChange={e => changeStatus(order, e.target.value as OrderStatus)}
                          disabled={updatingId === order.id}
                          className="border border-cream-300 bg-cream-50 rounded-lg px-2 py-1.5 text-xs font-medium text-charcoal focus:outline-none focus:ring-2 focus:ring-wine-500/25 disabled:opacity-50 cursor-pointer"
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
