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
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading orders...
        </div>
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
          className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
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
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear date
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => exportOrdersToExcel(filtered)}
            disabled={filtered.length === 0}
            className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white text-sm font-medium transition-colors"
          >
            Export Excel
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
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
      <p className="text-sm text-gray-500 mb-3 print:hidden">
        Showing <span className="font-medium text-gray-700">{filtered.length}</span> of {orders.length} orders
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🥩</p>
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Pickup Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Notes</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(order => {
                  const meatItems = MEAT_TYPES.filter(mt => order[mt.key] > 0)
                    .map(mt => `${mt.label} ${order[mt.key]}lb`)

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-gray-500 text-xs">{order.customer_phone}</p>
                        <p className="text-gray-400 text-xs">{order.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {format(new Date(order.pickup_date + 'T00:00:00'), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {meatItems.map(item => (
                            <span key={item} className="inline-block bg-red-50 text-[#8B0000] text-xs px-2 py-0.5 rounded-full font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[180px]">
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
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B0000] disabled:opacity-50 cursor-pointer"
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
