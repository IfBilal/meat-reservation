'use client'

import { Order } from '@/types'
import { MEAT_TYPES } from '@/lib/constants'
import { format } from 'date-fns'

export function TotalsPanel({ orders }: { orders: Order[] }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayOrders = orders.filter(o => o.pickup_date === today)

  const totals = MEAT_TYPES.map(mt => ({
    label: mt.label,
    total: todayOrders.reduce((sum, o) => sum + Number(o[mt.key] ?? 0), 0),
  }))

  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Today&apos;s Pickup Totals — {format(new Date(), 'MMMM d, yyyy')}
      </h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {totals.map(({ label, total }) => (
          <div key={label} className="text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-[#8B0000]">{total}</p>
            <p className="text-xs text-gray-400">lbs</p>
          </div>
        ))}
      </div>
    </div>
  )
}
